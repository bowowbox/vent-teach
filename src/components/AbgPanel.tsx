import { Panel, Slider } from './ui'
import { useSession } from '../session/sessionStore'
import { useSim } from '../store/simStore'
import { estimateAbg, phFrom } from '../session/abg'
import { useUI } from '../i18n'

// The blood-gas loop, both halves in one file because they are two ends of one exchange:
//   learner presses Request  ->  instructor gets a badge  ->  instructor fills and
//   Releases  ->  learner sees the result with a timestamp.
//
// The engine has no gas exchange, so the numbers are the instructor's to choose. The
// "Estimate from MV" button does arithmetic on two standard relationships (see abg.ts) to
// save typing; it is labelled as an estimate because that is all it is.

function timeOf(ms: number): string {
  return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function GasRow({ ph, paco2, pao2, hco3 }: { ph: number; paco2: number; pao2: number; hco3: number }) {
  return (
    <div className="grid grid-cols-4 gap-2 text-center">
      {[
        { k: 'pH', v: ph.toFixed(2) },
        { k: 'PaCO₂', v: String(paco2) },
        { k: 'PaO₂', v: String(pao2) },
        { k: 'HCO₃', v: String(hco3) },
      ].map((c) => (
        <div key={c.k} className="rounded-lg bg-slate-800/60 py-1.5">
          <div className="text-[10px] uppercase tracking-wide text-slate-500">{c.k}</div>
          <div className="tabular text-base font-semibold text-slate-100">{c.v}</div>
        </div>
      ))}
    </div>
  )
}

/** Learner side: ask for a gas, then read it. */
export function AbgLearnerPanel() {
  const result = useSession((s) => s.abgResult)
  const requestedAt = useSession((s) => s.abgRequestedAt)
  const requestAbg = useSession((s) => s.requestAbg)
  const ui = useUI()

  // Pending means asked-for and not yet answered *since* the asking — a second request
  // after an earlier result must read as pending again.
  const pending = requestedAt !== null && (!result || result.releasedAt < requestedAt)

  return (
    <Panel title={ui.session.abgTitle}>
      <div className="space-y-2.5">
        {result ? (
          <>
            <GasRow ph={result.ph} paco2={result.paco2} pao2={result.pao2} hco3={result.hco3} />
            <p className="text-[10px] text-slate-500">
              {ui.session.releasedAt} {timeOf(result.releasedAt)}
            </p>
          </>
        ) : (
          <p className="text-xs text-slate-400">{ui.session.abgNone}</p>
        )}

        {pending ? (
          <p className="flex items-center gap-2 text-xs text-amber-400">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            {ui.session.abgPending}
          </p>
        ) : (
          <button
            onClick={requestAbg}
            className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium text-slate-200 hover:bg-slate-700 transition"
          >
            {ui.session.requestAbg}
          </button>
        )}
      </div>
    </Panel>
  )
}

/** Instructor side: see the request, fill the gas, release it. */
export function AbgInstructorPanel() {
  const draft = useSession((s) => s.abgDraft)
  const setAbgDraft = useSession((s) => s.setAbgDraft)
  const releaseAbg = useSession((s) => s.releaseAbg)
  const result = useSession((s) => s.abgResult)
  const requestedAt = useSession((s) => s.abgRequestedAt)
  const remoteTelemetry = useSession((s) => s.remoteTelemetry)
  const localTelemetry = useSim((s) => s.telemetry)
  const ui = useUI()

  // Prefer the learner's measured minute ventilation; fall back to our own engine before
  // their first telemetry arrives.
  const mv = remoteTelemetry?.minuteVentilation ?? localTelemetry.minuteVentilation
  const outstanding = requestedAt !== null && (!result || result.releasedAt < requestedAt)

  const applyEstimate = () => {
    const { paco2, ph } = estimateAbg(mv, draft.hco3)
    setAbgDraft({ paco2, ph })
  }

  return (
    <Panel
      title={ui.session.abgTitle}
      right={
        outstanding ? (
          <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-amber-400">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            {ui.session.abgRequested}
          </span>
        ) : undefined
      }
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <Slider
            label="PaCO₂"
            value={draft.paco2}
            min={20}
            max={100}
            step={1}
            unit="mmHg"
            // pH follows PaCO2 and HCO3 rather than floating free, so the instructor cannot
            // accidentally release a gas that is internally inconsistent.
            onChange={(v) => setAbgDraft({ paco2: v, ph: phFrom(v, draft.hco3) })}
          />
          <Slider
            label="PaO₂"
            value={draft.pao2}
            min={30}
            max={300}
            step={1}
            unit="mmHg"
            onChange={(v) => setAbgDraft({ pao2: v })}
          />
          <Slider
            label="HCO₃"
            value={draft.hco3}
            min={8}
            max={45}
            step={1}
            unit="mEq/L"
            onChange={(v) => setAbgDraft({ hco3: v, ph: phFrom(draft.paco2, v) })}
          />
          <Slider
            label="pH"
            value={draft.ph}
            min={6.8}
            max={7.7}
            step={0.01}
            onChange={(v) => setAbgDraft({ ph: v })}
            danger={draft.ph < 7.2 || draft.ph > 7.55}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={releaseAbg}
            className="rounded-lg bg-sky-500 px-3 py-1.5 text-sm font-semibold text-slate-950 hover:bg-sky-400 transition"
          >
            {ui.session.release}
          </button>
          <button
            onClick={applyEstimate}
            className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium text-slate-200 hover:bg-slate-700 transition"
          >
            {ui.session.estimate}
          </button>
          {result ? (
            <span className="text-[10px] text-slate-500">
              {ui.session.releasedAt} {timeOf(result.releasedAt)}
            </span>
          ) : null}
        </div>

        <p className="text-[10px] leading-tight text-slate-500">{ui.session.estimateHint}</p>
      </div>
    </Panel>
  )
}
