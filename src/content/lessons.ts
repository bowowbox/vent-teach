import type { SimSettings, VentSettings, LungParams, EffortParams } from '../engine/types'
import { defaultSettings } from '../engine/presets'
import type { LearnerLevel } from '../store/simStore'

export type Block =
  | { t: 'p'; text: string }
  | { t: 'h'; text: string }
  | { t: 'list'; items: string[] }
  | { t: 'callout'; tone: 'key' | 'safety' | 'tip'; text: string }
  | { t: 'try'; label: string; note: string; settings: SimSettings }

export interface Lesson {
  id: string
  title: string
  subtitle: string
  minLevel: LearnerLevel // lowest level this is aimed at (all higher levels see it too)
  blocks: Block[]
  refIds: string[]
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

export const lessons: Lesson[] = [
  {
    id: 'anatomy',
    title: '1 · Anatomy of a breath',
    subtitle: 'The three waveforms every ventilator shows you',
    minLevel: 'student',
    blocks: [
      {
        t: 'p',
        text: 'Every mechanical breath can be read from three scalar waveforms plotted against time: pressure (in the airway), flow (gas moving in and out), and volume (what has entered the lungs). Learn to read these three and you can understand almost everything a ventilator is doing.',
      },
      { t: 'h', text: 'Pressure' },
      {
        t: 'p',
        text: 'Airway pressure rises during inspiration and returns toward the set PEEP (baseline pressure) during expiration. In volume modes the shape of the pressure curve is a result of the patient’s lung mechanics; in pressure modes you set the pressure and it stays roughly square.',
      },
      { t: 'h', text: 'Flow' },
      {
        t: 'p',
        text: 'Flow is positive when gas moves into the patient (inspiration) and negative during expiration. Inspiratory flow shape differs by mode — a square wave in volume control, a decelerating ramp in pressure control. Expiratory flow is passive and decays back toward zero.',
      },
      { t: 'h', text: 'Volume' },
      {
        t: 'p',
        text: 'Volume is the integral of flow — it climbs to the tidal volume during inspiration and falls back to baseline as the patient exhales. If it does NOT return to baseline before the next breath, gas is being trapped.',
      },
      {
        t: 'callout',
        tone: 'key',
        text: 'Watch the flow trace return (or fail to return) to zero before the next breath — it is the single most useful habit for spotting gas trapping and, later, dyssynchrony.',
      },
      {
        t: 'try',
        label: 'Show me a normal breath',
        note: 'Normal lungs, volume control, passive patient. Watch all three waveforms cycle cleanly.',
        settings: make({ vent: { mode: 'VC-AC', rate: 14, tidalVolume: 420, inspFlow: 50, peep: 5 } }),
      },
    ],
    refIds: ['arnal2018', 'flynn2022'],
  },
  {
    id: 'modes',
    title: '2 · Modes: what the ventilator controls',
    subtitle: 'Volume vs. pressure — and who does the work',
    minLevel: 'student',
    blocks: [
      {
        t: 'p',
        text: 'A ventilator can only guarantee one thing at a time. In volume control you set the tidal volume and the pressure is whatever the lungs require. In pressure control you set the pressure and the tidal volume is whatever the lungs allow. This trade-off is the single most important idea in choosing a mode.',
      },
      { t: 'h', text: 'Volume Assist-Control (VC-AC)' },
      {
        t: 'list',
        items: [
          'You set: tidal volume, flow, rate, PEEP, FiO₂.',
          'Guaranteed: tidal volume (and therefore minute ventilation).',
          'Watch: pressure can climb if the lung stiffens — a rising plateau pressure is your warning.',
        ],
      },
      { t: 'h', text: 'Pressure Assist-Control (PC-AC)' },
      {
        t: 'list',
        items: [
          'You set: inspiratory pressure, inspiratory time, rate, PEEP, FiO₂.',
          'Guaranteed: peak pressure (protective by design).',
          'Watch: tidal volume falls if the lung stiffens — hypoventilation can sneak up on you.',
        ],
      },
      { t: 'h', text: 'Pressure Support (PSV)' },
      {
        t: 'p',
        text: 'A purely spontaneous mode: every breath is triggered by the patient and the ventilator adds a set pressure boost, cycling to exhalation when flow falls. Used for weaning and comfort — but it needs a patient with reliable respiratory drive.',
      },
      {
        t: 'callout',
        tone: 'tip',
        text: 'In the simulator, switch a stiff (ARDS) lung between VC-AC and PC-AC without changing anything else, and watch what "gives" — the pressure in volume control, or the tidal volume in pressure control.',
      },
      {
        t: 'try',
        label: 'Volume control, stiff lung',
        note: 'ARDS lung in VC-AC. Note the high plateau pressure — the price of a guaranteed volume.',
        settings: make({ vent: { mode: 'VC-AC', tidalVolume: 420, inspFlow: 50, peep: 10 }, lung: { compliance: 30, resistance: 10, resistanceExp: 12 } }),
      },
      {
        t: 'try',
        label: 'Pressure control, same lung',
        note: 'Same ARDS lung in PC-AC at 15 cmH₂O. Note the smaller tidal volume — the price of a capped pressure.',
        settings: make({ vent: { mode: 'PC-AC', pInsp: 15, inspTime: 1.0, peep: 10 }, lung: { compliance: 30, resistance: 10, resistanceExp: 12 } }),
      },
    ],
    refIds: ['arnal2018', 'grasselli2023'],
  },
  {
    id: 'oxygenation',
    title: '3 · Oxygenation: PEEP & FiO₂',
    subtitle: 'The two knobs that set the oxygen',
    minLevel: 'student',
    blocks: [
      {
        t: 'p',
        text: 'Oxygenation is driven mainly by two settings: the fraction of inspired oxygen (FiO₂) and positive end-expiratory pressure (PEEP). FiO₂ enriches the gas; PEEP keeps alveoli open at the end of expiration so they can keep participating in gas exchange.',
      },
      { t: 'h', text: 'PEEP' },
      {
        t: 'list',
        items: [
          'Recruits and stabilises collapsed alveoli, raising the surface area for oxygen exchange.',
          'Too little: alveoli collapse and reopen with each breath (injurious).',
          'Too much: over-distension, higher plateau pressure, and haemodynamic compromise.',
        ],
      },
      {
        t: 'callout',
        tone: 'key',
        text: 'PEEP and FiO₂ are titrated together to reach an oxygenation target while keeping pressures safe — this is the essence of an ARDS ventilation strategy.',
      },
      {
        t: 'try',
        label: 'Raise PEEP on a stiff lung',
        note: 'ARDS lung. Increase PEEP with the control and watch the baseline pressure rise — clinically this is where recruitment happens.',
        settings: make({ vent: { mode: 'VC-AC', tidalVolume: 400, peep: 10, fio2: 0.6 }, lung: { compliance: 28, resistance: 10, resistanceExp: 12 } }),
      },
    ],
    refIds: ['sahetya2017', 'grieco2026', 'grasselli2023'],
  },
  {
    id: 'ventilation',
    title: '4 · Ventilation: tidal volume & rate',
    subtitle: 'Clearing CO₂ — minute ventilation',
    minLevel: 'student',
    blocks: [
      {
        t: 'p',
        text: 'Carbon dioxide clearance depends on minute ventilation = tidal volume × respiratory rate. Raise either and you blow off more CO₂; lower either and CO₂ rises. But tidal volume and rate are not interchangeable — how you reach a given minute ventilation matters for lung safety.',
      },
      {
        t: 'list',
        items: [
          'Bigger tidal volumes clear CO₂ efficiently but stretch the lung (volutrauma).',
          'Faster rates clear CO₂ too, but shorten expiratory time and can cause gas trapping.',
          'Read the measured minute ventilation and total rate in the telemetry bar as you experiment.',
        ],
      },
      {
        t: 'callout',
        tone: 'safety',
        text: 'In obstructive lungs, chasing CO₂ with a high rate backfires — short expiratory time traps gas and raises auto-PEEP. Sometimes the answer is a LOWER rate.',
      },
      {
        t: 'try',
        label: 'Push the rate on a COPD lung',
        note: 'Obstructive lung at rate 24. Watch expiratory flow fail to reach zero — that is gas trapping / auto-PEEP.',
        settings: make({ vent: { mode: 'VC-AC', rate: 24, tidalVolume: 450, inspFlow: 50, peep: 5 }, lung: { compliance: 60, resistance: 18, resistanceExp: 28 } }),
      },
    ],
    refIds: ['arnal2018'],
  },
  {
    id: 'lung-protective',
    title: '5 · Lung-protective ventilation',
    subtitle: 'Plateau pressure & driving pressure',
    minLevel: 'nurse',
    blocks: [
      {
        t: 'p',
        text: 'The lung is injured not just by oxygen but by the mechanical stress of ventilation. Lung-protective ventilation limits that stress: low tidal volumes (around 6 mL/kg predicted body weight), a plateau pressure under about 30 cmH₂O, and attention to driving pressure (plateau minus PEEP).',
      },
      { t: 'h', text: 'Plateau pressure' },
      {
        t: 'p',
        text: 'Plateau pressure is the pressure held in the alveoli during an inspiratory pause, with no flow — it reflects the elastic stress on the lung, unlike peak pressure which also includes airway resistance. The simulator estimates it for each breath in the telemetry bar.',
      },
      { t: 'h', text: 'Driving pressure' },
      {
        t: 'p',
        text: 'Driving pressure (plateau − PEEP) is tidal volume normalised to the patient’s compliance, and tracks with outcome in ARDS. Keeping it low (≈ ≤ 15 cmH₂O) is a practical bedside target.',
      },
      {
        t: 'callout',
        tone: 'safety',
        text: 'If the plateau pressure climbs above 30 cmH₂O, it turns red in the telemetry bar. Lower the tidal volume before you chase anything else.',
      },
      {
        t: 'try',
        label: 'Injurious vs. protective',
        note: 'Severe ARDS with a large 550 mL tidal volume. Note the high plateau, then lower tidal volume toward 6 mL/kg and watch it fall.',
        settings: make({ vent: { mode: 'VC-AC', tidalVolume: 550, inspFlow: 50, peep: 12, fio2: 0.7 }, lung: { compliance: 22, resistance: 12, resistanceExp: 14 } }),
      },
    ],
    refIds: ['grasselli2023', 'matthay2024', 'sahetya2017'],
  },
  {
    id: 'triggering',
    title: '6 · Triggering & cycling',
    subtitle: 'How the patient and ventilator hand off — the bridge to dyssynchrony',
    minLevel: 'nurse',
    blocks: [
      {
        t: 'p',
        text: 'Once a patient is breathing with the ventilator instead of being fully controlled, every breath involves a negotiation. The patient triggers the breath (starts it), the ventilator delivers the target, and then the breath is cycled off (ended). When the timing of these hand-offs matches the patient, breathing feels effortless. When it does not, you get dyssynchrony.',
      },
      { t: 'h', text: 'Trigger' },
      {
        t: 'p',
        text: 'The ventilator senses a patient effort as a small drop in pressure or a small flow, and delivers a breath. Set the sensitivity too high and it triggers on noise (auto-triggering); too low and it misses genuine efforts.',
      },
      { t: 'h', text: 'Cycle' },
      {
        t: 'p',
        text: 'The breath ends by volume (VC), by time (PC), or by flow decay (PSV). If the ventilator’s inspiration is longer or shorter than the patient’s own neural breath, they fight — the origin of cycling asynchronies.',
      },
      {
        t: 'callout',
        tone: 'tip',
        text: 'Turn on "Patient effort" in the sandbox and toggle "Show Pmus" to see the patient’s own drive alongside the machine. The next module puts this to work on real dyssynchronies.',
      },
      {
        t: 'try',
        label: 'A comfortable assisted patient',
        note: 'Volume control with a matched patient effort — triggers are green and one effort yields one breath.',
        settings: make({
          vent: { mode: 'VC-AC', rate: 12, tidalVolume: 450, inspFlow: 55, triggerType: 'flow', triggerSensitivity: 2, peep: 5 },
          effort: { enabled: true, amplitude: 6, rate: 15, neuralTi: 0.9, riseFraction: 0.4, coupling: 'independent', reverseDelay: 0.3 },
        }),
      },
    ],
    refIds: ['thille2026', 'costa2025', 'dres2016'],
  },
]

export const levelRank: Record<LearnerLevel, number> = { student: 0, nurse: 1, resident: 2 }

/** True when a lesson sits above the learner's current level (shown as a "stretch" badge). */
export function isStretch(lesson: Lesson, level: LearnerLevel): boolean {
  return levelRank[lesson.minLevel] > levelRank[level]
}
