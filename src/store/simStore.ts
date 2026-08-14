import { create } from 'zustand'
import { VentSim } from '../engine/simulation'
import type {
  SimSettings,
  Telemetry,
  VentSettings,
  LungParams,
  EffortParams,
} from '../engine/types'
import { defaultSettings } from '../engine/presets'

// A single simulation instance lives outside React and is stepped by the RAF loop.
export const sim = new VentSim(defaultSettings)

interface SimStore {
  settings: SimSettings
  telemetry: Telemetry
  running: boolean
  speed: number
  showPmus: boolean

  setVent: (patch: Partial<VentSettings>) => void
  setLung: (patch: Partial<LungParams>) => void
  setEffort: (patch: Partial<EffortParams>) => void
  applySettings: (s: SimSettings) => void
  setRunning: (r: boolean) => void
  toggleRunning: () => void
  setSpeed: (s: number) => void
  setShowPmus: (v: boolean) => void
  resetSim: () => void
  _setTelemetry: (t: Telemetry) => void
}

const emptyTelemetry: Telemetry = {
  peakPressure: 0,
  plateauPressure: 0,
  measuredTidalVolume: 0,
  inspTime: 0,
  totalRate: 0,
  autoPeep: 0,
  ieRatio: '1:0.0',
  minuteVentilation: 0,
}

export const useSim = create<SimStore>((set) => ({
  settings: structuredClone(defaultSettings),
  telemetry: emptyTelemetry,
  running: true,
  speed: 1,
  showPmus: false,

  setVent: (patch) => {
    sim.updateSettings({ vent: patch })
    set((st) => ({ settings: { ...st.settings, vent: { ...st.settings.vent, ...patch } } }))
  },
  setLung: (patch) => {
    sim.updateSettings({ lung: patch })
    set((st) => ({ settings: { ...st.settings, lung: { ...st.settings.lung, ...patch } } }))
  },
  setEffort: (patch) => {
    sim.updateSettings({ effort: patch })
    set((st) => ({ settings: { ...st.settings, effort: { ...st.settings.effort, ...patch } } }))
  },
  applySettings: (s) => {
    sim.updateSettings({ vent: s.vent, lung: s.lung, effort: s.effort })
    set({ settings: structuredClone(s) })
  },
  setRunning: (r) => set({ running: r }),
  toggleRunning: () => set((st) => ({ running: !st.running })),
  setSpeed: (s) => set({ speed: s }),
  setShowPmus: (v) => set({ showPmus: v }),
  resetSim: () => {
    sim.reset()
    set({ telemetry: emptyTelemetry })
  },
  _setTelemetry: (t) => set({ telemetry: t }),
}))
