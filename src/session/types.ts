// Teaching-session types: an instructor drives the patient, a learner drives the
// ventilator, and the two are joined by a short code over Firebase Realtime Database.
//
// Vital signs and blood gases live HERE rather than in SimSettings on purpose. The
// engine models respiratory mechanics and nothing else — it has no gas exchange and no
// haemodynamics — so pushing monitor numbers through VentSim, structuredClone and every
// scenarios.check() grader would buy nothing. The session layer owns them instead, which
// is why this feature touches neither src/engine nor src/content.

export type SessionRole = 'instructor' | 'learner'

/** Connection lifecycle as the UI needs to see it. */
export type SessionStatus =
  | 'idle' // not in a session
  | 'connecting' // creating or joining
  | 'connected'
  | 'error'

/** What the monitor above the bed shows. Instructor-authored; the engine never sees it. */
export interface VitalSigns {
  hr: number // beats/min
  sysBP: number // mmHg
  diaBP: number // mmHg
  spo2: number // %
  rr: number // breaths/min (clinically observed, incl. spontaneous effort)
  temp: number // °C
}

/** An arterial blood gas the instructor fills in and releases to the learner. */
export interface AbgResult {
  ph: number
  paco2: number // mmHg
  pao2: number // mmHg
  hco3: number // mEq/L
  releasedAt: number // epoch ms
}

/** The learner asking for a gas. Separate node so each field keeps a single writer. */
export interface AbgRequest {
  at: number // epoch ms
}

export const defaultVitals: VitalSigns = {
  hr: 88,
  sysBP: 118,
  diaBP: 68,
  spo2: 96,
  rr: 16,
  temp: 37.0,
}

/** Starting point for the instructor's ABG sliders — a normal gas on room air. */
export const defaultAbgDraft: Omit<AbgResult, 'releasedAt'> = {
  ph: 7.4,
  paco2: 40,
  pao2: 90,
  hco3: 24,
}

/** Which side may write which node. Documented here because it is the load-bearing rule. */
export const OWNERSHIP = {
  instructor: ['patient/lung', 'patient/effort', 'vitals', 'abg/result'],
  learner: ['vent', 'telemetry', 'abg/request'],
} as const
