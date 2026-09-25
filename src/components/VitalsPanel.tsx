import { Panel, Slider } from './ui'
import { useSession } from '../session/sessionStore'
import { useUI } from '../i18n'

// The instructor's authoring surface for the monitor. Every change publishes (throttled)
// and lands on the learner's strip within a fraction of a second.
//
// These are the numbers the engine does not model: it has no gas exchange and no
// haemodynamics, so nothing here is derived from the ventilator settings. Driving them is
// the instructor's clinical judgement, which is the point of having a person in the loop.

export function VitalsPanel() {
  const vitals = useSession((s) => s.vitals)
  const setVitals = useSession((s) => s.setVitals)
  const ui = useUI()

  return (
    <Panel title={ui.session.vitalsTitle}>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Slider
          label="HR"
          value={vitals.hr}
          min={30}
          max={180}
          step={1}
          unit="/min"
          onChange={(v) => setVitals({ hr: v })}
        />
        <Slider
          label="SpO₂"
          value={vitals.spo2}
          min={70}
          max={100}
          step={1}
          unit="%"
          onChange={(v) => setVitals({ spo2: v })}
        />
        <Slider
          label="Systolic BP"
          value={vitals.sysBP}
          min={60}
          max={200}
          step={1}
          unit="mmHg"
          // Keep the diastolic below the systolic: a 90/110 reading on the learner's
          // monitor would read as a bug in the app rather than as a sick patient.
          onChange={(v) => setVitals({ sysBP: v, diaBP: Math.min(v - 10, vitals.diaBP) })}
        />
        <Slider
          label="Diastolic BP"
          value={vitals.diaBP}
          min={30}
          max={120}
          step={1}
          unit="mmHg"
          onChange={(v) => setVitals({ diaBP: Math.min(v, vitals.sysBP - 10) })}
        />
        <Slider
          label="RR (observed)"
          value={vitals.rr}
          min={5}
          max={45}
          step={1}
          unit="/min"
          onChange={(v) => setVitals({ rr: v })}
        />
        <Slider
          label="Temp"
          value={vitals.temp}
          min={34}
          max={41}
          step={0.1}
          unit="°C"
          onChange={(v) => setVitals({ temp: v })}
        />
      </div>
    </Panel>
  )
}
