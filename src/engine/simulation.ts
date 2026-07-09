import type {
  SimSettings,
  Sample,
  Telemetry,
  TriggerEvent,
  VentSettings,
  LungParams,
  EffortParams,
} from './types'

// ---------------------------------------------------------------------------
// Single-compartment respiratory model driven by the equation of motion:
//
//   Paw + Pmus = PEEP + (V / C) + (R * Q)
//
// where V is volume above the resting end-expiratory volume at PEEP (litres),
// C is compliance (L/cmH2O), R is resistance (cmH2O/(L/s)), Q is flow (L/s,
// inspiratory positive) and Pmus is inspiratory muscle pressure (cmH2O).
//
// Volume-controlled breaths fix Q and solve for Paw. Pressure-targeted breaths
// (PC/PSV) and expiration fix Paw and solve for Q. Patient effort, triggering
// against auto-PEEP, and neural/ventilator timing mismatches are all explicit,
// so ineffective triggering, double triggering, flow starvation and reverse
// triggering emerge from the physics rather than being drawn in by hand.
// ---------------------------------------------------------------------------

const DT = 0.002 // internal integration step (s)
const STORE_DT = 0.008 // sample spacing written to the display buffer (s)
const WINDOW_S = 12 // seconds of history retained for the sweep
const REFRACTORY = 0.25 // min seconds between triggered breaths
const CARDIAC_OSC = 0.8 // cmH2O baseline oscillation (enables auto-trigger teaching)

export class VentSim {
  private s: SimSettings
  private t = 0
  private V = 0 // litres above PEEP resting volume
  private Q = 0 // L/s
  private paw = 0
  private phase: 'insp' | 'exp' = 'exp'
  private phaseStart = 0
  private lastBreathStart = -999
  private breathStartVol = 0 // litres in the lung at the start of the current inspiration
  private peakInspFlow = 0 // L/s this breath (for PSV cycling)
  private neuralClock = 0 // s within the patient's neural cycle
  private prevPmus = 0
  private prevOsc = 0
  private effortCounted = false // whether current neural effort produced a breath
  private breathTimes: number[] = []

  // Telemetry latches (updated at end of each breath)
  private tPeak = 0
  private tPlateau = 0
  private tTidal = 0
  private tAutoPeep = 0

  private buffer: Sample[] = []
  private storeAccum = 0

  constructor(settings: SimSettings) {
    this.s = structuredClone(settings)
    this.paw = settings.vent.peep
  }

  reset() {
    this.t = 0
    this.V = 0
    this.Q = 0
    this.paw = this.s.vent.peep
    this.phase = 'exp'
    this.phaseStart = 0
    this.lastBreathStart = -999
    this.breathStartVol = 0
    this.peakInspFlow = 0
    this.neuralClock = 0
    this.prevPmus = 0
    this.prevOsc = 0
    this.effortCounted = false
    this.breathTimes = []
    this.tPeak = this.tPlateau = this.tTidal = this.tAutoPeep = 0
    this.buffer = []
    this.storeAccum = 0
  }

  updateSettings(partial: {
    vent?: Partial<VentSettings>
    lung?: Partial<LungParams>
    effort?: Partial<EffortParams>
  }) {
    if (partial.vent) this.s.vent = { ...this.s.vent, ...partial.vent }
    if (partial.lung) this.s.lung = { ...this.s.lung, ...partial.lung }
    if (partial.effort) this.s.effort = { ...this.s.effort, ...partial.effort }
  }

  getSettings(): SimSettings {
    return this.s
  }

  getBuffer(): Sample[] {
    return this.buffer
  }

  getTelemetry(): Telemetry {
    const total = this.currentRate()
    const mv = (this.tTidal * total) / 1000 // L/min
    const ti = this.estimatedTi()
    const te = total > 0 ? 60 / total - ti : 0
    const ratio = ti > 0 ? (te / ti).toFixed(1) : '0.0'
    return {
      peakPressure: round1(this.tPeak),
      plateauPressure: round1(this.tPlateau),
      measuredTidalVolume: Math.round(this.tTidal),
      totalRate: Math.round(total),
      autoPeep: round1(this.tAutoPeep),
      ieRatio: `1:${ratio}`,
      minuteVentilation: round1(mv),
    }
  }

  /** Advance the simulation by `realDt` seconds of wall time, scaled by `speed`. */
  advance(realDt: number, speed = 1) {
    let remaining = Math.min(realDt * speed, 0.1) // cap to avoid huge catch-up jumps
    while (remaining > 0) {
      const step = Math.min(DT, remaining)
      this.step(step)
      remaining -= step
    }
  }

  // ---- core integration step -------------------------------------------------
  private step(dt: number) {
    const { vent, lung, effort } = this.s
    const C = lung.compliance / 1000 // L/cmH2O
    const pmus = this.computePmus(dt)

    // Detect neural effort onset/offset for ineffective-trigger accounting.
    const effortRising = pmus > this.prevPmus && pmus > 0.5
    if (pmus < 0.3) this.effortCounted = false

    let trigger: TriggerEvent | undefined

    // Cardiogenic oscillation on the baseline. It exists only to drive the auto-triggering
    // lesson, so it is applied ONLY when it could actually cause auto-triggering: a passive
    // patient on a pressure trigger set sensitive enough for the oscillation to cross it.
    // In every other case the expiratory baseline stays smooth.
    const oscActive =
      vent.triggerType === 'pressure' &&
      !effort.enabled &&
      Math.max(0.3, vent.triggerSensitivity) <= CARDIAC_OSC
    const osc = oscActive ? CARDIAC_OSC * Math.sin(this.t * 8) : 0

    if (this.phase === 'exp') {
      // Ventilator holds PEEP; solve expiratory flow (Pmus assists exhalation-resisting effort).
      this.paw = vent.peep + osc
      this.Q = (this.paw + pmus - vent.peep - this.V / C) / lung.resistanceExp

      // --- triggering decisions ---
      const sinceBreath = this.t - this.lastBreathStart
      const autoPeep = Math.max(0, this.V / C) // residual elastic pressure = dynamic PEEP
      const pressThresh =
        vent.triggerType === 'pressure' ? vent.triggerSensitivity : vent.triggerSensitivity * lung.resistanceExp / 60
      const triggerThresh = Math.max(0.3, pressThresh) // raw sensitivity as a pressure
      // Patient must overcome auto-PEEP AND the set sensitivity to trigger.
      const effectiveNeed = autoPeep + triggerThresh

      const canTrigger = sinceBreath > REFRACTORY
      const mandatoryDue =
        (vent.mode === 'VC-AC' || vent.mode === 'PC-AC') &&
        sinceBreath >= 60 / vent.rate

      if (canTrigger && effort.enabled && pmus >= effectiveNeed && effortRising) {
        // A patient trigger arriving right after exhalation opened = stacked/double breath.
        const sinceExp = this.t - this.phaseStart
        trigger = sinceExp < 0.35 ? 'double' : 'patient'
        this.tAutoPeep = round1(autoPeep)
      } else if (canTrigger && mandatoryDue) {
        trigger = 'time'
        this.tAutoPeep = round1(autoPeep)
      } else if (
        canTrigger &&
        vent.triggerType === 'pressure' &&
        !effort.enabled &&
        osc >= triggerThresh &&
        this.prevOsc < triggerThresh // rising crossing of the oscillation past the trigger threshold
      ) {
        trigger = 'auto'
      } else if (
        effort.enabled &&
        effort.coupling !== 'reverse-trigger' &&
        !this.effortCounted &&
        pmus > 0.5 &&
        pmus < effectiveNeed &&
        this.prevPmus > pmus // effort peaked without triggering
      ) {
        // Neural effort that failed to open a breath = ineffective trigger.
        trigger = 'ineffective'
        this.effortCounted = true
      }

      if (trigger === 'patient' || trigger === 'time' || trigger === 'auto' || trigger === 'double') {
        this.startInspiration(trigger)
        this.effortCounted = true
      }
    } else {
      // Inspiration
      const tIn = this.t - this.phaseStart
      if (vent.mode === 'VC-AC') {
        // Constant inspiratory flow (square wave); Paw is dependent.
        const setFlow = vent.inspFlow / 60 // L/s
        this.Q = setFlow
        this.paw = vent.peep + this.V / C + lung.resistance * this.Q - pmus
        this.peakInspFlow = Math.max(this.peakInspFlow, this.Q)
        // Cycle once a full set tidal volume has been delivered THIS breath. Measuring
        // delivered volume relative to the breath's starting lung volume is what lets a
        // stacked (double-triggered) second breath deliver its own full tidal volume.
        if (this.V - this.breathStartVol >= vent.tidalVolume / 1000) {
          this.endInspiration()
        }
      } else {
        // Pressure-targeted (PC-AC / PSV / CPAP): Paw follows target with rise time.
        const target =
          vent.mode === 'PC-AC'
            ? vent.pInsp
            : vent.mode === 'PSV'
              ? vent.pSupport
              : 0 // CPAP: no support above PEEP
        const ramp = vent.riseTime > 0 ? Math.min(1, tIn / vent.riseTime) : 1
        const pt = target * smooth(ramp)
        this.paw = vent.peep + pt
        this.Q = (pt + pmus - this.V / C) / lung.resistance
        this.peakInspFlow = Math.max(this.peakInspFlow, this.Q)

        // Cycling
        if (vent.mode === 'PC-AC') {
          if (tIn >= vent.inspTime) this.endInspiration()
        } else if (vent.mode === 'PSV') {
          if (this.Q <= this.peakInspFlow * vent.cycleOff && tIn > 0.15) this.endInspiration()
          else if (tIn > 3.0) this.endInspiration() // safety cycle
        } else {
          // CPAP: "inspiration" ends when patient effort wanes (flow reverses)
          if (this.Q <= 0 && tIn > 0.1) this.endInspiration()
        }
      }
    }

    // Integrate volume.
    this.V = Math.max(0, this.V + this.Q * dt)

    this.prevPmus = pmus
    this.prevOsc = osc
    this.t += dt

    // Write to display buffer at STORE_DT spacing.
    this.storeAccum += dt
    if (this.storeAccum >= STORE_DT) {
      this.storeAccum = 0
      this.pushSample(pmus, trigger)
    } else if (trigger && trigger !== 'time') {
      // Ensure notable non-time events are marked even between store ticks.
      this.pushSample(pmus, trigger)
    }
  }

  private startInspiration(trigger: TriggerEvent) {
    this.phase = 'insp'
    this.phaseStart = this.t
    this.lastBreathStart = this.t
    this.breathStartVol = this.V
    this.peakInspFlow = 0.0001
    this.breathTimes.push(this.t)
    const cutoff = this.t - 30
    this.breathTimes = this.breathTimes.filter((x) => x > cutoff)
    // Reverse-triggering entrainment: a mandatory breath resets the neural clock.
    if (this.s.effort.coupling === 'reverse-trigger' && trigger === 'time') {
      this.neuralClock = -this.s.effort.reverseDelay
    }
    this.pendingTrigger = trigger
  }

  private pendingTrigger: TriggerEvent | undefined

  private endInspiration() {
    const C = this.s.lung.compliance / 1000
    // Plateau = elastic pressure at end-inspiration (no-flow), peak = last Paw.
    this.tPlateau = round1(this.s.vent.peep + this.V / C)
    this.tPeak = round1(Math.max(this.paw, this.tPlateau))
    this.tTidal = this.V * 1000
    // Double triggering: if neural effort is still active as we open the exhalation
    // valve, the patient immediately re-triggers a stacked breath.
    this.phase = 'exp'
    this.phaseStart = this.t
  }

  private computePmus(dt: number): number {
    const e = this.s.effort
    if (!e.enabled) {
      this.neuralClock += dt
      return 0
    }
    const period = 60 / e.rate
    this.neuralClock += dt
    if (this.neuralClock >= period) this.neuralClock -= period
    const tc = this.neuralClock
    if (tc < 0 || tc > e.neuralTi) return 0
    const riseDur = e.neuralTi * e.riseFraction
    let shape: number
    if (tc <= riseDur) {
      shape = 0.5 * (1 - Math.cos((Math.PI * tc) / riseDur)) // 0 -> 1
    } else {
      const fallDur = e.neuralTi - riseDur
      shape = 0.5 * (1 + Math.cos((Math.PI * (tc - riseDur)) / fallDur)) // 1 -> 0
    }
    return e.amplitude * shape
  }

  private pushSample(pmus: number, trigger?: TriggerEvent) {
    this.buffer.push({
      t: this.t,
      paw: round1(this.paw),
      flow: round1(this.Q * 60), // L/min
      volume: Math.round(this.V * 1000), // mL
      pmus: round1(pmus),
      phase: this.phase,
      triggerEvent: trigger ?? this.pendingTrigger,
    })
    this.pendingTrigger = undefined
    const cutoff = this.t - WINDOW_S
    while (this.buffer.length && this.buffer[0].t < cutoff) this.buffer.shift()
  }

  private currentRate(): number {
    if (this.breathTimes.length < 2) return 0
    const span = this.t - this.breathTimes[0]
    if (span <= 0) return 0
    return ((this.breathTimes.length - 1) / span) * 60
  }

  private estimatedTi(): number {
    const { vent } = this.s
    if (vent.mode === 'VC-AC') return vent.tidalVolume / 1000 / (vent.inspFlow / 60)
    if (vent.mode === 'PC-AC') return vent.inspTime
    return 0.9 // approximate for PSV/CPAP
  }
}

function round1(x: number): number {
  return Math.round(x * 10) / 10
}

// Smooth ease for pressure rise (S-curve).
function smooth(x: number): number {
  return x * x * (3 - 2 * x)
}
