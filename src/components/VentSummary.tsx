import { Panel } from './ui'
import { useSession } from '../session/sessionStore'
import { useUI } from '../i18n'
import type { VentSettings } from '../engine/types'

// What the learner currently has dialled, read-only, for the instructor.
//
// A read-only list rather than a disabled copy of ControlPanel: it is denser, it reads at
// a glance while you are also watching a waveform, and it avoids threading a `disabled`
// prop through every shared control for one caller.
//
// Mode-aware for the same reason ControlPanel is — showing Insp. pressure in VC-AC or
// tidal volume in PSV would be noise, and worse, would suggest the learner had set them.

function rows(v: VentSettings): { k: string; val: string }[] {
  const out: { k: string; val: string }[] = [
    { k: 'Mode', val: v.mode },
    { k: 'FiO₂', val: `${Math.round(v.fio2 * 100)} %` },
    { k: 'PEEP', val: `${v.peep} cmH₂O` },
  ]

  if (v.mode === 'VC-AC' || v.mode === 'PC-AC') {
    out.push({ k: 'Set rate', val: `${v.rate} /min` })
  }
  if (v.mode === 'VC-AC') {
    out.push(
      { k: 'Tidal volume', val: `${v.tidalVolume} mL` },
      { k: 'Peak flow', val: `${v.inspFlow} L/min` },
      { k: 'Flow pattern', val: v.flowPattern === 'square' ? 'Square' : 'Decelerating' },
      { k: 'Insp. pause', val: v.pauseTime > 0 ? `${v.pauseTime.toFixed(1)} s` : 'Off' },
    )
  }
  if (v.mode === 'PC-AC') {
    out.push(
      { k: 'Insp. pressure', val: `${v.pInsp} cmH₂O` },
      { k: 'Insp. time', val: `${v.inspTime.toFixed(1)} s` },
    )
  }
  if (v.mode === 'PSV') {
    out.push(
      { k: 'Pressure support', val: `${v.pSupport} cmH₂O` },
      { k: 'Cycle-off', val: `${Math.round(v.cycleOff * 100)} %` },
    )
  }
  if (v.mode === 'PC-AC' || v.mode === 'PSV') {
    out.push({ k: 'Rise time', val: `${v.riseTime.toFixed(2)} s` })
  }

  out.push(
    { k: 'Trigger', val: v.triggerType === 'flow' ? 'Flow' : 'Pressure' },
    {
      k: 'Sensitivity',
      val: `${v.triggerSensitivity} ${v.triggerType === 'flow' ? 'L/min' : 'cmH₂O'}`,
    },
  )
  return out
}

export function VentSummary() {
  const remoteVent = useSession((s) => s.remoteVent)
  const ui = useUI()

  return (
    <Panel title={ui.session.ventSummaryTitle}>
      {remoteVent ? (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          {rows(remoteVent).map((r) => (
            <div key={r.k} className="flex items-baseline justify-between gap-2">
              <dt className="text-xs text-slate-400 truncate">{r.k}</dt>
              <dd className="tabular text-xs font-semibold text-sky-300 shrink-0">{r.val}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-xs text-slate-500">{ui.session.waitingLearner}</p>
      )}
    </Panel>
  )
}
