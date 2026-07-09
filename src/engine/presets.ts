import type { SimSettings, LungParams, EffortParams, VentSettings } from './types'

export const defaultVent: VentSettings = {
  mode: 'VC-AC',
  fio2: 0.4,
  peep: 5,
  rate: 14,
  tidalVolume: 420, // ~6 mL/kg for a 70 kg PBW patient
  inspFlow: 50, // L/min
  pInsp: 15,
  pSupport: 12,
  inspTime: 1.0,
  riseTime: 0.15,
  cycleOff: 0.25,
  triggerType: 'flow',
  triggerSensitivity: 2, // L/min
}

// --- Lung phenotypes --------------------------------------------------------
export interface LungPreset {
  id: string
  label: string
  blurb: string
  lung: LungParams
}

export const lungPresets: LungPreset[] = [
  {
    id: 'normal',
    label: 'Normal lungs',
    blurb: 'Healthy compliance and resistance. Baseline for learning normal waveforms.',
    lung: { compliance: 60, resistance: 8, resistanceExp: 10 },
  },
  {
    id: 'ards',
    label: 'ARDS (stiff)',
    blurb: 'Low compliance "baby lung". Watch plateau pressure and driving pressure.',
    lung: { compliance: 30, resistance: 10, resistanceExp: 12 },
  },
  {
    id: 'copd',
    label: 'COPD (obstructive)',
    blurb: 'High resistance with slow emptying. Prone to auto-PEEP and gas trapping.',
    lung: { compliance: 65, resistance: 18, resistanceExp: 28 },
  },
  {
    id: 'severe-ards',
    label: 'Severe ARDS',
    blurb: 'Very low compliance. Small tidal volumes and high PEEP become critical.',
    lung: { compliance: 20, resistance: 12, resistanceExp: 14 },
  },
]

export const defaultEffort: EffortParams = {
  enabled: false,
  amplitude: 6,
  rate: 18,
  neuralTi: 0.9,
  riseFraction: 0.4,
  coupling: 'independent',
  reverseDelay: 0.3,
}

export const defaultSettings: SimSettings = {
  vent: { ...defaultVent },
  lung: { ...lungPresets[0].lung },
  effort: { ...defaultEffort },
}

export function findLungPreset(lung: LungParams): string {
  const hit = lungPresets.find(
    (p) =>
      p.lung.compliance === lung.compliance &&
      p.lung.resistance === lung.resistance &&
      p.lung.resistanceExp === lung.resistanceExp,
  )
  return hit?.id ?? 'custom'
}
