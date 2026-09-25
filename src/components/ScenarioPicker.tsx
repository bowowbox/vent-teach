import { Panel, Toggle } from './ui'
import { scenarios } from '../content/scenarios'
import { NORMAL_CASE_ID, useSession } from '../session/sessionStore'
import { useUI } from '../i18n'

// One-click case loading for the instructor. Hand-dialling compliance, resistance and four
// effort parameters mid-teaching is far too slow when the Dyssynchrony tab already loads
// the same thing in a click.
//
// Instructor-only, and deliberately so: the scenario titles are the diagnosis, which is
// exactly what the learner is meant to work out from the waveforms.
//
// Scenario titles are plain English strings rather than `LS` — the diagnostic terms are
// kept untranslated, like the ventilator-panel labels.

export function ScenarioPicker() {
  const activeScenarioId = useSession((s) => s.activeScenarioId)
  const pushVent = useSession((s) => s.pushVentWithScenario)
  const setPushVent = useSession((s) => s.setPushVent)
  const loadScenario = useSession((s) => s.loadScenario)
  const ui = useUI()

  const pills = [{ id: NORMAL_CASE_ID, title: ui.session.normalCase }, ...scenarios]

  return (
    <Panel title={ui.session.scenarioTitle}>
      <div className="space-y-2.5">
        {/* Horizontal scroll on mobile, wrapping from sm: up — same as the Dyssynchrony tab. */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 sm:mx-0 sm:px-0 sm:flex-wrap">
          {pills.map((p) => (
            <button
              key={p.id}
              onClick={() => loadScenario(p.id)}
              className={`shrink-0 sm:shrink rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                activeScenarioId === p.id
                  ? 'bg-sky-500 text-slate-950'
                  : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700/60'
              }`}
            >
              {p.title}
            </button>
          ))}
        </div>

        <div className="border-t border-slate-800 pt-2.5">
          <Toggle label={ui.session.alsoSetVent} checked={pushVent} onChange={setPushVent} />
          <p className="mt-1.5 text-[10px] leading-tight text-slate-500">
            {ui.session.scenarioHint}
          </p>
        </div>
      </div>
    </Panel>
  )
}
