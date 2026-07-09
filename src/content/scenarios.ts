import type { SimSettings, VentSettings, LungParams, EffortParams } from '../engine/types'
import { defaultSettings } from '../engine/presets'

export interface Scenario {
  id: string
  title: string
  short: string // one-line summary for cards
  category: 'trigger' | 'flow' | 'cycle' | 'reverse'
  settings: SimSettings
  // Teaching content
  mechanism: string
  recognize: string[] // bullet points: what to look for on the waveforms
  fix: string[] // bullet points: how to resolve it
  refIds: string[]
  // Challenge check: given current live settings, is the asynchrony resolved?
  check: (s: SimSettings) => boolean
  successText: string
}

function make(base: {
  vent?: Partial<VentSettings>
  lung?: Partial<LungParams>
  effort?: Partial<EffortParams>
}): SimSettings {
  return {
    vent: { ...defaultSettings.vent, ...(base.vent ?? {}) },
    lung: { ...defaultSettings.lung, ...(base.lung ?? {}) },
    effort: { ...defaultSettings.effort, ...(base.effort ?? {}) },
  }
}

export const scenarios: Scenario[] = [
  {
    id: 'ineffective',
    title: 'Ineffective triggering',
    short: 'Patient efforts that fail to open the valve — usually from auto-PEEP.',
    category: 'trigger',
    settings: make({
      vent: {
        mode: 'VC-AC',
        rate: 20,
        tidalVolume: 500,
        inspFlow: 40,
        triggerType: 'pressure',
        triggerSensitivity: 3,
        peep: 5,
      },
      lung: { compliance: 65, resistance: 18, resistanceExp: 28 },
      effort: { enabled: true, amplitude: 5, rate: 28, neuralTi: 0.8, riseFraction: 0.4, coupling: 'independent', reverseDelay: 0.3 },
    }),
    mechanism:
      'Dynamic hyperinflation (auto-PEEP) in obstructive lungs means the patient must first generate enough pressure to overcome the trapped gas before the ventilator senses an effort. A weak effort, a high (insensitive) trigger threshold, or a high set rate that shortens expiratory time all make this worse. The neural effort happens, but no breath is delivered.',
    recognize: [
      'Small negative deflection in the pressure trace with a simultaneous notch/bump in the expiratory flow — but no delivered breath follows.',
      'Patient (neural) rate is higher than the delivered ventilator rate.',
      'Auto-PEEP present: expiratory flow does not return to zero before the next breath.',
      'Marked "!" on the pressure lane in the simulator.',
    ],
    fix: [
      'Reduce auto-PEEP: lower the set rate and/or shorten inspiratory time to lengthen expiratory time.',
      'Reduce resistance/obstruction where possible (bronchodilators, suction clinically).',
      'Increase trigger sensitivity (lower the number).',
      'Consider matched external PEEP to counterbalance auto-PEEP in flow-limited patients.',
    ],
    refIds: ['thille2026', 'deharo2019', 'dres2016'],
    check: (s) =>
      s.vent.rate <= 14 && s.vent.triggerSensitivity <= 2 && s.vent.triggerType === 'pressure'
        ? true
        : s.vent.rate <= 12,
    successText:
      'Lengthening expiratory time (lower rate) reduces auto-PEEP so the patient can trigger, and a more sensitive trigger helps. Efforts now translate into breaths.',
  },
  {
    id: 'double',
    title: 'Double triggering / breath stacking',
    short: 'Two stacked breaths from one neural effort — neural Ti outlasts the vent breath.',
    category: 'trigger',
    settings: make({
      vent: {
        mode: 'VC-AC',
        rate: 16,
        tidalVolume: 350,
        inspFlow: 70,
        triggerType: 'flow',
        triggerSensitivity: 2,
        peep: 5,
      },
      lung: { compliance: 40, resistance: 10, resistanceExp: 12 },
      effort: { enabled: true, amplitude: 12, rate: 22, neuralTi: 1.3, riseFraction: 0.35, coupling: 'independent', reverseDelay: 0.3 },
    }),
    mechanism:
      "The patient's neural inspiration lasts longer than the ventilator's inspiratory time (common with a short, high-flow VC breath and a strong, air-hungry patient). The moment the first breath cycles off, the ongoing effort immediately re-triggers a second breath before exhalation — the two breaths stack, delivering a doubled tidal volume at high transpulmonary pressure.",
    recognize: [
      'Two breaths back-to-back with little or no expiration between them ("2x" marker).',
      'The second breath stacks on residual volume → large combined tidal volume.',
      'Common in ARDS patients with high respiratory drive on low tidal volumes.',
    ],
    fix: [
      'Lengthen the ventilator inspiratory time to match neural Ti (lower flow, or larger set Vt, or switch toward a pressure mode).',
      'Reduce respiratory drive: treat pain/anxiety, adequate sedation, correct acidosis/hypoxia.',
      'A slightly larger set tidal volume can abolish stacking (balance against lung-protective targets).',
    ],
    refIds: ['thille2026', 'sottile2024', 'costa2025'],
    check: (s) =>
      (s.vent.mode === 'VC-AC' && s.vent.tidalVolume / (s.vent.inspFlow / 60) >= 1.1) ||
      (s.vent.mode === 'PC-AC' && s.vent.inspTime >= 1.1) ||
      s.effort.amplitude <= 6,
    successText:
      'Matching the ventilator inspiratory time to the neural effort (or reducing drive) stops the second stacked breath. One effort now yields one breath.',
  },
  {
    id: 'flow-starvation',
    title: 'Flow starvation (flow asynchrony)',
    short: 'Set flow too low for a hungry patient — pressure scoops downward mid-breath.',
    category: 'flow',
    settings: make({
      vent: {
        mode: 'VC-AC',
        rate: 14,
        tidalVolume: 450,
        inspFlow: 30,
        triggerType: 'flow',
        triggerSensitivity: 2,
        peep: 5,
      },
      lung: { compliance: 50, resistance: 10, resistanceExp: 12 },
      effort: { enabled: true, amplitude: 12, rate: 18, neuralTi: 1.0, riseFraction: 0.4, coupling: 'independent', reverseDelay: 0.3 },
    }),
    mechanism:
      'In volume control the inspiratory flow is fixed. If the patient demands more flow than the ventilator delivers, their inspiratory effort pulls airway pressure down during the breath — the fixed-flow delivery cannot keep up with demand.',
    recognize: [
      'Concave ("scooped" or dished-out) downslope on the pressure waveform during inspiration.',
      'Worse with strong effort and low set flow; the pressure trace is pulled toward the Pmus curve (toggle "Show Pmus").',
      'Patient looks like they are "pulling" against the ventilator.',
    ],
    fix: [
      'Increase the set inspiratory flow to meet demand.',
      'Switch to a pressure-targeted mode (PC/PSV) where flow is delivered on demand.',
      'Reduce respiratory drive (analgesia/sedation, treat the underlying cause).',
    ],
    refIds: ['costa2025', 'flynn2022', 'arnal2018'],
    check: (s) =>
      (s.vent.mode === 'VC-AC' && s.vent.inspFlow >= 60) ||
      s.vent.mode === 'PC-AC' ||
      s.vent.mode === 'PSV' ||
      s.effort.amplitude <= 6,
    successText:
      'Raising the set flow (or switching to a pressure mode where flow is delivered on demand) removes the scooped pressure — supply now meets the patient’s demand.',
  },
  {
    id: 'reverse',
    title: 'Reverse triggering',
    short: 'A mandatory breath entrains the patient’s effort — muscle contraction follows the machine.',
    category: 'reverse',
    settings: make({
      vent: {
        mode: 'VC-AC',
        rate: 16,
        tidalVolume: 420,
        inspFlow: 50,
        triggerType: 'flow',
        triggerSensitivity: 2,
        peep: 6,
      },
      lung: { compliance: 35, resistance: 10, resistanceExp: 12 },
      effort: { enabled: true, amplitude: 8, rate: 16, neuralTi: 0.9, riseFraction: 0.4, coupling: 'reverse-trigger', reverseDelay: 0.35 },
    }),
    mechanism:
      'In sedated patients, a passive (machine-triggered) breath can reflexively entrain the diaphragm so that a patient effort begins shortly after each mandatory breath — the neural rhythm is driven by the ventilator, the reverse of normal triggering. It can generate extra volume (breath stacking) and injurious transpulmonary pressures.',
    recognize: [
      'A consistent effort deflection appearing at a fixed delay AFTER each mandatory breath begins.',
      'Often 1:1 or entrained ratios (e.g., every breath, or every other breath).',
      'May cause a second stacked breath (reverse-triggered double).',
      'Toggle "Show Pmus" to see effort locked to the machine breath.',
    ],
    fix: [
      'Recognize it — it is easily mistaken for a comfortable patient or simple triggering.',
      'Adjust sedation depth (both deeper and lighter planes have been described; assess effect).',
      'Reduce controlled over-assistance; consider mode/settings that let the patient breathe more naturally.',
      'Watch for injurious stacked breaths and transpulmonary pressure.',
    ],
    refIds: ['sottile2024', 'thille2026', 'deharo2019'],
    check: (s) => s.effort.coupling === 'independent' || !s.effort.enabled,
    successText:
      'Reverse triggering is primarily a recognition problem. Here, decoupling the effort from the machine breath (clinically: adjusting sedation/assist) breaks the entrainment.',
  },
  {
    id: 'autotrigger',
    title: 'Auto-triggering',
    short: 'The ventilator triggers itself — sensitivity set too high, no real effort.',
    category: 'trigger',
    settings: make({
      vent: {
        mode: 'PC-AC',
        rate: 12,
        pInsp: 14,
        inspTime: 1.0,
        triggerType: 'pressure',
        triggerSensitivity: 0.5,
        peep: 5,
      },
      lung: { compliance: 55, resistance: 9, resistanceExp: 11 },
      effort: { enabled: false, amplitude: 6, rate: 16, neuralTi: 0.9, riseFraction: 0.4, coupling: 'independent', reverseDelay: 0.3 },
    }),
    mechanism:
      'When the trigger is set too sensitive, small non-effort signals — cardiac oscillations, circuit leaks, water in the tubing, or condensation — are misread as patient effort and deliver extra breaths. The delivered rate exceeds the set rate with no patient breathing.',
    recognize: [
      'Total rate higher than the set rate, with the patient passive (no effort).',
      'Breaths appear at irregular or heart-rate-linked intervals ("A" marker).',
      'Risk of respiratory alkalosis and misinterpreted "patient effort".',
    ],
    fix: [
      'Make the trigger less sensitive (raise the number).',
      'Clinically: clear circuit condensate, fix leaks, check for cardiac oscillation.',
    ],
    refIds: ['dres2016', 'thille2026'],
    check: (s) => s.vent.triggerSensitivity >= 1.5,
    successText:
      'A less sensitive trigger ignores the cardiogenic oscillation, so the ventilator only cycles at its set rate.',
  },
  {
    id: 'delayed-cycle',
    title: 'Delayed cycling (COPD on PSV)',
    short: 'Inspiration runs into expiration — cycle-off set too low in obstruction.',
    category: 'cycle',
    settings: make({
      vent: {
        mode: 'PSV',
        pSupport: 14,
        cycleOff: 0.1,
        riseTime: 0.1,
        triggerType: 'flow',
        triggerSensitivity: 2,
        peep: 5,
      },
      lung: { compliance: 60, resistance: 18, resistanceExp: 26 },
      effort: { enabled: true, amplitude: 8, rate: 16, neuralTi: 0.8, riseFraction: 0.4, coupling: 'independent', reverseDelay: 0.3 },
    }),
    mechanism:
      'In pressure support, inspiration ends when flow decays to a set fraction of peak. In obstructive lungs flow decays slowly, so a low cycle-off threshold makes the ventilator keep pushing gas after the patient wants to exhale — machine inspiration outlasts neural inspiration, promoting hyperinflation and ineffective efforts.',
    recognize: [
      'Prolonged ventilator inspiration; the patient begins to exhale against the breath (a terminal pressure spike can appear).',
      'Short expiratory time → auto-PEEP and, downstream, ineffective triggering.',
    ],
    fix: [
      'Raise the expiratory cycle-off threshold (e.g., from 10% toward 40–50% of peak flow) to shorten inspiration.',
      'Reduce pressure support if tidal volumes are large.',
    ],
    refIds: ['costa2025', 'oto2021', 'arnal2018'],
    check: (s) => s.vent.mode === 'PSV' && s.vent.cycleOff >= 0.35,
    successText:
      'A higher cycle-off threshold ends inspiration sooner, matching the patient’s shorter neural breath and giving more time to exhale.',
  },
]

export function scenarioById(id: string): Scenario | undefined {
  return scenarios.find((s) => s.id === id)
}
