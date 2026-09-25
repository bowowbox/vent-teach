import { create } from 'zustand'
import { useSim } from '../store/simStore'
import { defaultSettings } from '../engine/presets'
import { scenarios } from '../content/scenarios'
import type { EffortParams, LungParams, Telemetry, VentSettings } from '../engine/types'
import { getDb, getDbApi, isFirebaseConfigured } from '../firebase'
import { generateCode } from './code'
import {
  defaultAbgDraft,
  defaultVitals,
  type AbgResult,
  type SessionRole,
  type SessionStatus,
  type VitalSigns,
} from './types'

// ---------------------------------------------------------------------------
// One shared patient across two devices.
//
// The load-bearing rule is SINGLE-WRITER OWNERSHIP: every node has exactly one author,
// and each side subscribes only to the nodes it does NOT own (see OWNERSHIP in types.ts).
// That makes an echo loop structurally impossible — there is no path by which a value we
// wrote comes back and re-triggers our own publish — so none of the usual revision
// counters or "applying remote" dirty flags are needed.
//
// Publishing is driven by subscribing to the existing sim store rather than by wrapping
// the control panels. ControlPanel and PatientPanel therefore work unchanged in a
// session; they call setVent/setLung/setEffort exactly as they do in the Sandbox.
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'venteach.session'

/** The "reset to a healthy patient" pseudo-scenario. Not an id in `scenarios`. */
export const NORMAL_CASE_ID = 'normal'

/**
 * One-shot instruction from the instructor to load a case. `vent` is present only when the
 * instructor chose to set the learner's ventilator too; the learner applies it and
 * republishes it as their own `vent`, so that node keeps a single writer.
 */
interface ScenarioCommand {
  id: string
  at: number
  vent?: VentSettings
}

/** Trailing throttle for settings writes: a slider drag is dozens of onChange events. */
const SETTINGS_MS = 120
/** Telemetry is only the instructor's numeric readout; 1/s is plenty and saves writes. */
const TELEMETRY_MS = 1000

type Off = () => void

interface Persisted {
  code: string
  role: SessionRole
}

interface SessionStore {
  role: SessionRole | null
  code: string | null
  status: SessionStatus
  error: string | null

  /** Whether the other side is currently connected (server-side presence). */
  peerPresent: boolean

  /** Instructor: the values being authored. Learner: the values received. */
  vitals: VitalSigns

  /** The instructor's working ABG before it is released. */
  abgDraft: Omit<AbgResult, 'releasedAt'>
  /** The last released gas, seen by both sides. */
  abgResult: AbgResult | null
  /** When the learner last asked for a gas (epoch ms), or null. */
  abgRequestedAt: number | null

  /** Instructor only: what the learner currently has dialled, and their real telemetry. */
  remoteVent: VentSettings | null
  remoteTelemetry: Telemetry | null

  /** The dyssynchrony case last loaded, or `'normal'`, or null if none yet. */
  activeScenarioId: string | null
  /** Instructor: whether loading a case also sets the learner's ventilator. */
  pushVentWithScenario: boolean

  setVitals: (patch: Partial<VitalSigns>) => void
  setPushVent: (v: boolean) => void
  /** Instructor only. `'normal'` resets to a healthy baseline. */
  loadScenario: (scenarioId: string) => void
  setAbgDraft: (patch: Partial<Omit<AbgResult, 'releasedAt'>>) => void
  releaseAbg: () => void
  requestAbg: () => void

  createSession: () => Promise<void>
  joinSession: (code: string) => Promise<void>
  leaveSession: () => Promise<void>
  /** Rejoin from localStorage after a reload. No-op when there is nothing saved. */
  restoreSession: () => Promise<void>
}

// --- module-scope connection state -----------------------------------------
// Views unmount on tab switch (App.tsx renders them behind && guards), so none of this
// can live in component state. Same precedent as `export const sim` in simStore.ts.
let offs: Off[] = []
let offSim: Off | null = null
const timers = new Map<string, ReturnType<typeof setTimeout>>()

function loadPersisted(): Persisted | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    // Validate before trusting it — the same discipline as detectLang() in i18n/index.ts.
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof (parsed as Persisted).code === 'string' &&
      ((parsed as Persisted).role === 'instructor' || (parsed as Persisted).role === 'learner')
    ) {
      return { code: (parsed as Persisted).code, role: (parsed as Persisted).role }
    }
  } catch {
    // Unparseable or unavailable (private mode) — start fresh.
  }
  return null
}

function savePersisted(p: Persisted | null) {
  try {
    if (p) localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Non-persistent is still usable for this session.
  }
}

/**
 * Trailing throttle keyed by node path. The last value always lands: a drag that ends
 * mid-window still flushes, so the database never holds a stale intermediate value.
 */
function throttledWrite(key: string, ms: number, write: () => void) {
  if (timers.has(key)) return // a flush is already scheduled; it will pick up the latest
  timers.set(
    key,
    setTimeout(() => {
      timers.delete(key)
      write()
    }, ms),
  )
}

function clearTimers() {
  for (const t of timers.values()) clearTimeout(t)
  timers.clear()
}

export const useSession = create<SessionStore>((set, get) => ({
  role: null,
  code: null,
  status: 'idle',
  error: null,
  peerPresent: false,
  vitals: { ...defaultVitals },
  abgDraft: { ...defaultAbgDraft },
  abgResult: null,
  abgRequestedAt: null,
  remoteVent: null,
  remoteTelemetry: null,
  activeScenarioId: null,
  pushVentWithScenario: true,

  setPushVent: (v) => set({ pushVentWithScenario: v }),

  loadScenario: (scenarioId) => {
    const { code, role, pushVentWithScenario } = get()
    if (role !== 'instructor') return

    const settings =
      scenarioId === NORMAL_CASE_ID
        ? defaultSettings
        : scenarios.find((s) => s.id === scenarioId)?.settings
    if (!settings) return

    // Apply only the half we own. NOT applySettings: that would also overwrite our local
    // `vent`, which we neither own nor publish, leaving our engine out of step with the
    // learner's real settings until they next touch a control. These two setters publish
    // to `patient` through the existing subscribeAndPublish path.
    const sim = useSim.getState()
    sim.setLung(settings.lung)
    sim.setEffort(settings.effort)
    sim.setRunning(true)

    set({ activeScenarioId: scenarioId })

    // The ventilator travels as a one-shot command rather than a direct write, so `vent`
    // keeps exactly one writer: the learner applies this and republishes it as their own.
    if (code) {
      const cmd: ScenarioCommand = { id: scenarioId, at: Date.now() }
      if (pushVentWithScenario) cmd.vent = settings.vent
      void writeNode(code, 'scenario', cmd)
    }
  },

  setVitals: (patch) => {
    const vitals = { ...get().vitals, ...patch }
    set({ vitals })
    const { code, role } = get()
    if (code && role === 'instructor') {
      throttledWrite('vitals', SETTINGS_MS, () => void writeNode(code, 'vitals', get().vitals))
    }
  },

  setAbgDraft: (patch) => set({ abgDraft: { ...get().abgDraft, ...patch } }),

  releaseAbg: () => {
    const { code, role, abgDraft } = get()
    if (!code || role !== 'instructor') return
    // Client clock, not serverTimestamp(): the instructor should see the release land
    // immediately rather than after a round-trip, and this value is display-only.
    const result: AbgResult = { ...abgDraft, releasedAt: Date.now() }
    set({ abgResult: result })
    void writeNode(code, 'abg/result', result)
  },

  requestAbg: () => {
    const { code, role } = get()
    if (!code || role !== 'learner') return
    const at = Date.now()
    set({ abgRequestedAt: at })
    void writeNode(code, 'abg/request', { at })
  },

  createSession: async () => {
    await connect(generateCode(), 'instructor', true, set, get)
  },

  joinSession: async (code) => {
    await connect(code, 'learner', false, set, get)
  },

  leaveSession: async () => {
    const { code, role } = get()
    teardown()
    if (code && role) {
      try {
        await writeNode(code, `presence/${role}`, null)
      } catch {
        // Leaving is best-effort; onDisconnect will clear presence anyway.
      }
    }
    savePersisted(null)
    set({
      role: null,
      code: null,
      status: 'idle',
      error: null,
      peerPresent: false,
      abgResult: null,
      abgRequestedAt: null,
      remoteVent: null,
      remoteTelemetry: null,
      activeScenarioId: null,
    })
  },

  restoreSession: async () => {
    if (get().status !== 'idle') return
    const saved = loadPersisted()
    if (!saved || !isFirebaseConfigured()) return
    await connect(saved.code, saved.role, saved.role === 'instructor', set, get)
  },
}))

// --- wire format helpers ---------------------------------------------------

async function writeNode(code: string, path: string, value: unknown): Promise<void> {
  const [db, api] = await Promise.all([getDb(), getDbApi()])
  await api.set(api.ref(db, `sessions/${code}/${path}`), value)
}

type Setter = (partial: Partial<SessionStore>) => void
type Getter = () => SessionStore

async function connect(
  code: string,
  role: SessionRole,
  creating: boolean,
  set: Setter,
  get: Getter,
) {
  teardown()
  set({
    status: 'connecting',
    error: null,
    code,
    role,
    peerPresent: false,
    activeScenarioId: null,
  })

  try {
    const [db, api] = await Promise.all([getDb(), getDbApi()])
    const base = `sessions/${code}`
    const at = (path: string) => api.ref(db, `${base}/${path}`)

    if (creating) {
      await api.set(at('meta'), { createdAt: Date.now(), role })
    } else {
      // Joining: refuse a code nobody is hosting, so a typo reads as "not found"
      // rather than silently opening an empty session that never updates.
      const snap = await api.get(at('meta'))
      if (!snap.exists()) {
        set({ status: 'error', error: 'notFound', code: null, role: null })
        return
      }
    }

    // Server-side presence: the peer's dot goes out even if this tab is killed.
    const presence = at(`presence/${role}`)
    await api.onDisconnect(presence).remove()
    await api.set(presence, true)

    const settings = useSim.getState().settings

    if (role === 'instructor') {
      // We own the patient; publish our current state so a joining learner inherits it.
      await api.set(at('patient'), { lung: settings.lung, effort: settings.effort })
      await api.set(at('vitals'), get().vitals)

      offs.push(
        api.onValue(at('vent'), (s) => {
          const vent = s.val() as VentSettings | null
          if (!vent) return
          set({ remoteVent: vent })
          // Run our own engine on the learner's settings so our tracing matches theirs.
          useSim.getState().setVent(vent)
        }),
        api.onValue(at('telemetry'), (s) => set({ remoteTelemetry: s.val() as Telemetry | null })),
        api.onValue(at('abg/request'), (s) => {
          const req = s.val() as { at: number } | null
          set({ abgRequestedAt: req?.at ?? null })
        }),
        api.onValue(at('presence/learner'), (s) => set({ peerPresent: Boolean(s.val()) })),
      )
    } else {
      // We own the ventilator; publish what we currently have dialled.
      await api.set(at('vent'), settings.vent)

      // Scoped per connection, so a rejoin gets a fresh skip-on-attach.
      let seenScenario = false

      offs.push(
        api.onValue(at('patient'), (s) => {
          const patient = s.val() as { lung?: LungParams; effort?: EffortParams } | null
          if (!patient) return
          // Applied to the engine but never rendered on the learner's screen — inferring
          // stiff lungs from the plateau pressure is the whole exercise.
          if (patient.lung) useSim.getState().setLung(patient.lung)
          if (patient.effort) useSim.getState().setEffort(patient.effort)
        }),
        api.onValue(at('vitals'), (s) => {
          const v = s.val() as VitalSigns | null
          if (v) set({ vitals: v })
        }),
        api.onValue(at('abg/result'), (s) => set({ abgResult: s.val() as AbgResult | null })),
        api.onValue(at('presence/instructor'), (s) => set({ peerPresent: Boolean(s.val()) })),
        api.onValue(at('scenario'), (s) => {
          const cmd = s.val() as ScenarioCommand | null
          // Ignore whatever is already there when we attach. onValue fires immediately
          // with the current value, and replaying an old command after a mid-session
          // reload would wipe out settings the learner has since dialled. A fresh joiner
          // still inherits the patient through `patient`; the instructor re-clicks the
          // case to push the ventilator.
          if (!seenScenario) {
            seenScenario = true
            set({ activeScenarioId: cmd?.id ?? null })
            return
          }
          if (!cmd) return
          set({ activeScenarioId: cmd.id })
          if (cmd.vent) useSim.getState().setVent(cmd.vent)
        }),
      )
    }

    offSim = subscribeAndPublish(code, role)
    savePersisted({ code, role })
    set({ status: 'connected' })
  } catch (err) {
    teardown()
    set({
      status: 'error',
      error: err instanceof Error ? err.message : 'connectFailed',
    })
  }
}

/**
 * Publish the slices this role owns whenever the sim store changes.
 *
 * setVent/setLung/setEffort each build a fresh object (simStore.ts:52-63), so reference
 * inequality is a reliable change test and costs nothing per frame.
 */
/** Value equality over the flat Telemetry record. */
function sameTelemetry(a: Telemetry, b: Telemetry | null): boolean {
  if (!b) return false
  return (
    a.peakPressure === b.peakPressure &&
    a.plateauPressure === b.plateauPressure &&
    a.measuredTidalVolume === b.measuredTidalVolume &&
    a.inspTime === b.inspTime &&
    a.totalRate === b.totalRate &&
    a.autoPeep === b.autoPeep &&
    a.ieRatio === b.ieRatio &&
    a.minuteVentilation === b.minuteVentilation
  )
}

function subscribeAndPublish(code: string, role: SessionRole): Off {
  let lastSent: Telemetry | null = null

  return useSim.subscribe((state, before) => {
    if (role === 'instructor') {
      if (state.settings.lung !== before.settings.lung) {
        throttledWrite('lung', SETTINGS_MS, () => {
          void writeNode(code, 'patient/lung', useSim.getState().settings.lung)
        })
      }
      if (state.settings.effort !== before.settings.effort) {
        throttledWrite('effort', SETTINGS_MS, () => {
          void writeNode(code, 'patient/effort', useSim.getState().settings.effort)
        })
      }
    } else {
      if (state.settings.vent !== before.settings.vent) {
        throttledWrite('vent', SETTINGS_MS, () => {
          void writeNode(code, 'vent', useSim.getState().settings.vent)
        })
      }
      // _setTelemetry builds a fresh object every 0.2 s, so reference inequality alone
      // would write once a second forever. The values are rounded, so a stable patient
      // produces identical readings — compare by value and stay silent when nothing moved.
      if (state.telemetry !== before.telemetry && !sameTelemetry(state.telemetry, lastSent)) {
        throttledWrite('telemetry', TELEMETRY_MS, () => {
          const t = useSim.getState().telemetry
          lastSent = t
          void writeNode(code, 'telemetry', t)
        })
      }
    }
  })
}

function teardown() {
  for (const off of offs) {
    try {
      off()
    } catch {
      // A listener detached twice is not an error worth surfacing.
    }
  }
  offs = []
  offSim?.()
  offSim = null
  clearTimers()
}
