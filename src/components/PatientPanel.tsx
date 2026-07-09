import { useSim } from '../store/simStore'
import { Slider, Panel, Toggle, SegGroup } from './ui'
import { lungPresets, findLungPreset } from '../engine/presets'
import { useT, useUI } from '../i18n'

export function PatientPanel() {
  const lung = useSim((s) => s.settings.lung)
  const effort = useSim((s) => s.settings.effort)
  const setLung = useSim((s) => s.setLung)
  const setEffort = useSim((s) => s.setEffort)
  const activePreset = findLungPreset(lung)
  const t = useT()
  const ui = useUI()

  return (
    <Panel title={ui.patient.panelTitle}>
      <div className="space-y-3.5">
        <div>
          <div className="text-xs font-medium text-slate-300 mb-1.5">{ui.patient.lungPhenotype}</div>
          <div className="grid grid-cols-2 gap-1.5">
            {lungPresets.map((p) => (
              <button
                key={p.id}
                onClick={() => setLung(p.lung)}
                title={t(p.blurb)}
                className={`px-2 py-1.5 text-xs font-medium rounded-lg text-left transition ${
                  activePreset === p.id
                    ? 'bg-sky-500/20 text-sky-200 ring-1 ring-sky-500'
                    : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700/60'
                }`}
              >
                {t(p.label)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <Slider
            label="Compliance"
            value={lung.compliance}
            min={15}
            max={80}
            step={1}
            unit="mL/cmH₂O"
            onChange={(v) => setLung({ compliance: v })}
          />
          <Slider
            label="Resistance"
            value={lung.resistance}
            min={5}
            max={30}
            step={1}
            unit="cmH₂O/L/s"
            onChange={(v) => setLung({ resistance: v, resistanceExp: Math.max(v, lung.resistanceExp) })}
          />
        </div>

        <div className="border-t border-slate-800 pt-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {ui.patient.patientEffort}
            </span>
            <Toggle
              label={effort.enabled ? ui.patient.breathing : ui.patient.passive}
              checked={effort.enabled}
              onChange={(v) => setEffort({ enabled: v })}
            />
          </div>

          {effort.enabled && (
            <>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <Slider
                  label={ui.patient.effortStrength}
                  value={effort.amplitude}
                  min={2}
                  max={20}
                  step={1}
                  unit="cmH₂O"
                  onChange={(v) => setEffort({ amplitude: v })}
                  hint={ui.patient.hint.amplitude}
                />
                <Slider
                  label={ui.patient.patientRate}
                  value={effort.rate}
                  min={8}
                  max={40}
                  step={1}
                  unit="/min"
                  onChange={(v) => setEffort({ rate: v })}
                  hint={ui.patient.hint.rate}
                />
                <Slider
                  label="Neural Ti"
                  value={effort.neuralTi}
                  min={0.4}
                  max={1.6}
                  step={0.1}
                  unit="s"
                  onChange={(v) => setEffort({ neuralTi: v })}
                  hint={ui.patient.hint.neuralTi}
                />
                <div className="flex items-end">
                  <SegGroup
                    label={ui.patient.coupling}
                    value={effort.coupling}
                    options={[
                      { value: 'independent', label: ui.patient.independent },
                      { value: 'reverse-trigger', label: ui.patient.reverse },
                    ]}
                    onChange={(c) => setEffort({ coupling: c })}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Panel>
  )
}
