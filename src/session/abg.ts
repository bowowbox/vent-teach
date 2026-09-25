// A prefill helper for the instructor's ABG panel. The engine has no gas-exchange model,
// so nothing here is simulated physiology — it is arithmetic on two standard
// relationships, offered as a starting point the instructor then overrides:
//
//   PaCO2 is inversely proportional to alveolar ventilation
//   pH    = 6.1 + log10( HCO3 / (0.03 * PaCO2) )        (Henderson-Hasselbalch)
//
// Labelled as an estimate everywhere it surfaces in the UI, because that is what it is.

/** Minute ventilation (L/min) that a 70 kg patient needs to sit at PaCO2 40. */
const REF_MV = 6.0
const REF_PACO2 = 40

/** Clinically plausible bounds; also the slider ranges in AbgPanel. */
const PACO2_MIN = 20
const PACO2_MAX = 100

export function estimatePaco2(minuteVentilation: number): number {
  if (!(minuteVentilation > 0)) return PACO2_MAX
  const raw = REF_PACO2 * (REF_MV / minuteVentilation)
  return clamp(Math.round(raw), PACO2_MIN, PACO2_MAX)
}

/** Henderson-Hasselbalch. Returns pH to 2 dp. */
export function phFrom(paco2: number, hco3: number): number {
  if (!(paco2 > 0) || !(hco3 > 0)) return 7.4
  const ph = 6.1 + Math.log10(hco3 / (0.03 * paco2))
  return clamp(Math.round(ph * 100) / 100, 6.6, 7.8)
}

/**
 * Prefill from the learner's current minute ventilation, holding HCO3 where the
 * instructor left it (metabolic state is a clinical choice, not a ventilator consequence).
 */
export function estimateAbg(
  minuteVentilation: number,
  hco3: number,
): { paco2: number; ph: number } {
  const paco2 = estimatePaco2(minuteVentilation)
  return { paco2, ph: phFrom(paco2, hco3) }
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x))
}
