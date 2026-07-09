import { useSim } from '../store/simStore'
import { Slider, SegGroup, Panel } from './ui'
import { useUI } from '../i18n'
import type { VentMode } from '../engine/types'

// Mode names are the labels printed on the ventilator — never translated.
const MODE_OPTIONS: { value: VentMode; label: string }[] = [
  { value: 'VC-AC', label: 'VC-AC' },
  { value: 'PC-AC', label: 'PC-AC' },
  { value: 'PSV', label: 'PSV' },
  { value: 'CPAP', label: 'CPAP' },
]

export function ControlPanel() {
  const vent = useSim((s) => s.settings.vent)
  const setVent = useSim((s) => s.setVent)
  const ui = useUI()

  return (
    <Panel title={ui.vent.panelTitle}>
      <div className="space-y-3.5">
        <div>
          <SegGroup
            label={ui.vent.mode}
            value={vent.mode}
            options={MODE_OPTIONS}
            onChange={(m) => setVent({ mode: m })}
          />
          <p className="mt-1.5 text-[10px] leading-tight text-slate-500">
            {ui.vent.modeDesc[vent.mode]}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <Slider
            label="FiO₂"
            value={Math.round(vent.fio2 * 100)}
            min={21}
            max={100}
            step={1}
            unit="%"
            onChange={(v) => setVent({ fio2: v / 100 })}
          />
          <Slider
            label="PEEP"
            value={vent.peep}
            min={0}
            max={20}
            step={1}
            unit="cmH₂O"
            onChange={(v) => setVent({ peep: v })}
          />

          {(vent.mode === 'VC-AC' || vent.mode === 'PC-AC') && (
            <Slider
              label={ui.vent.setRate}
              value={vent.rate}
              min={6}
              max={35}
              step={1}
              unit="/min"
              onChange={(v) => setVent({ rate: v })}
            />
          )}

          {vent.mode === 'VC-AC' && (
            <>
              <Slider
                label="Tidal volume"
                value={vent.tidalVolume}
                min={200}
                max={700}
                step={10}
                unit="mL"
                onChange={(v) => setVent({ tidalVolume: v })}
              />
              <Slider
                label="Insp. flow"
                value={vent.inspFlow}
                min={20}
                max={90}
                step={5}
                unit="L/min"
                onChange={(v) => setVent({ inspFlow: v })}
                hint={ui.vent.hint.inspFlow}
              />
            </>
          )}

          {vent.mode === 'PC-AC' && (
            <>
              <Slider
                label="Insp. pressure"
                value={vent.pInsp}
                min={5}
                max={35}
                step={1}
                unit="cmH₂O"
                onChange={(v) => setVent({ pInsp: v })}
                hint={ui.vent.hint.pInsp}
              />
              <Slider
                label="Insp. time"
                value={vent.inspTime}
                min={0.5}
                max={2.0}
                step={0.1}
                unit="s"
                onChange={(v) => setVent({ inspTime: v })}
              />
            </>
          )}

          {vent.mode === 'PSV' && (
            <>
              <Slider
                label="Pressure support"
                value={vent.pSupport}
                min={0}
                max={30}
                step={1}
                unit="cmH₂O"
                onChange={(v) => setVent({ pSupport: v })}
              />
              <Slider
                label="Cycle-off"
                value={Math.round(vent.cycleOff * 100)}
                min={5}
                max={70}
                step={5}
                unit="%"
                onChange={(v) => setVent({ cycleOff: v / 100 })}
                hint={ui.vent.hint.cycleOff}
              />
            </>
          )}

          {(vent.mode === 'PC-AC' || vent.mode === 'PSV') && (
            <Slider
              label="Rise time"
              value={vent.riseTime}
              min={0}
              max={0.6}
              step={0.05}
              unit="s"
              onChange={(v) => setVent({ riseTime: v })}
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-slate-800 pt-3">
          <SegGroup
            label="Trigger"
            value={vent.triggerType}
            options={[
              { value: 'flow', label: 'Flow' },
              { value: 'pressure', label: 'Pressure' },
            ]}
            onChange={(t) => setVent({ triggerType: t })}
          />
          <Slider
            label={ui.vent.sensitivity}
            value={vent.triggerSensitivity}
            min={0.5}
            max={vent.triggerType === 'flow' ? 10 : 5}
            step={0.5}
            unit={vent.triggerType === 'flow' ? 'L/min' : 'cmH₂O'}
            onChange={(v) => setVent({ triggerSensitivity: v })}
            hint={ui.vent.hint.sensitivity}
          />
        </div>
      </div>
    </Panel>
  )
}
