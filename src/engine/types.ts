// Core physiological + ventilator types for the simulation engine.
// All pressures in cmH2O, volumes in mL (converted to L internally for flow math),
// flow in L/s (displayed as L/min), time in seconds.

export type VentMode =
  | 'VC-AC' // Volume Assist-Control (constant flow, volume-cycled)
  | 'PC-AC' // Pressure Assist-Control (pressure-targeted, time-cycled)
  | 'PSV' // Pressure Support (patient-triggered, flow-cycled)
  | 'CPAP' // Spontaneous / CPAP (no inspiratory support above PEEP)

export interface VentSettings {
  mode: VentMode
  fio2: number // 0.21 - 1.0
  peep: number // cmH2O
  rate: number // set/backup respiratory rate (breaths/min)
  tidalVolume: number // mL (VC modes)
  inspFlow: number // L/min peak set flow (VC modes; constant-flow model)
  pInsp: number // cmH2O ABOVE PEEP (PC-AC inspiratory pressure)
  pSupport: number // cmH2O ABOVE PEEP (PSV support level)
  inspTime: number // seconds (PC-AC)
  riseTime: number // seconds to reach target pressure (PC/PSV)
  cycleOff: number // PSV expiratory flow cycling threshold, fraction of peak (0-1)
  triggerType: 'flow' | 'pressure'
  triggerSensitivity: number // cmH2O (pressure) or L/min (flow) below baseline
}

export interface LungParams {
  compliance: number // mL/cmH2O (static respiratory system compliance)
  resistance: number // cmH2O/(L/s) inspiratory airway resistance
  resistanceExp: number // cmH2O/(L/s) expiratory resistance (>= insp for obstruction)
}

export interface EffortParams {
  enabled: boolean
  amplitude: number // cmH2O, peak inspiratory muscle pressure (Pmus)
  rate: number // patient's intrinsic neural respiratory rate (breaths/min)
  neuralTi: number // seconds, duration of neural inspiration (Pmus active)
  riseFraction: number // fraction of neuralTi spent rising (0-1)
  // Coupling to the ventilator for teaching specific asynchronies:
  coupling: 'independent' | 'reverse-trigger'
  reverseDelay: number // seconds after a mandatory breath that Pmus fires (reverse triggering)
}

export interface SimSettings {
  vent: VentSettings
  lung: LungParams
  effort: EffortParams
}

// One rendered sample of the three scalar waveforms.
export interface Sample {
  t: number // absolute sim time (s)
  paw: number // airway pressure (cmH2O)
  flow: number // L/min (positive = inspiratory)
  volume: number // mL above end-expiratory (PEEP) resting volume
  pmus: number // cmH2O muscle pressure (for optional overlay / teaching)
  phase: 'insp' | 'exp'
  triggerEvent?: TriggerEvent
}

export type TriggerEvent =
  | 'patient' // patient-triggered assisted breath
  | 'time' // machine/mandatory breath
  | 'ineffective' // patient effort that failed to trigger
  | 'double' // second stacked breath immediately following the first
  | 'auto' // auto-triggered (no real effort)

// Rolling telemetry the UI reads once per animation frame.
export interface Telemetry {
  peakPressure: number // cmH2O, last breath Ppeak
  plateauPressure: number // cmH2O, last breath estimated Pplat
  measuredTidalVolume: number // mL, last delivered breath
  totalRate: number // breaths/min (machine + patient)
  autoPeep: number // cmH2O, estimated intrinsic PEEP
  ieRatio: string // e.g. "1:2.0"
  minuteVentilation: number // L/min
}
