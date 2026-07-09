import { useEffect, useState } from 'react'
import { scenarios, type Scenario } from '../content/scenarios'
import { useSim } from '../store/simStore'
import { SimStage } from '../components/SimStage'
import { ControlPanel } from '../components/ControlPanel'
import { PatientPanel } from '../components/PatientPanel'
import { ReferenceList } from '../components/ReferenceList'
import { Panel } from '../components/ui'

const CATEGORY_LABEL: Record<Scenario['category'], string> = {
  trigger: 'Trigger asynchrony',
  flow: 'Flow asynchrony',
  cycle: 'Cycle asynchrony',
  reverse: 'Reverse triggering',
}

export function DyssynchronyView() {
  const [activeId, setActiveId] = useState(scenarios[0].id)
  const applySettings = useSim((s) => s.applySettings)
  const setRunning = useSim((s) => s.setRunning)
  const scenario = scenarios.find((s) => s.id === activeId)!

  // Load the scenario whenever it changes.
  useEffect(() => {
    applySettings(scenario.settings)
    setRunning(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId])

  return (
    <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
      {/* Scenario picker: horizontal scroll on mobile */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0 sm:flex-wrap">
        {scenarios.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveId(s.id)}
            className={`shrink-0 sm:shrink rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              activeId === s.id
                ? 'bg-sky-500 text-slate-950'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700/60'
            }`}
          >
            {s.title}
          </button>
        ))}
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-sky-400 bg-sky-400/10 rounded px-1.5 py-0.5">
            {CATEGORY_LABEL[scenario.category]}
          </span>
          <h1 className="text-lg font-bold text-slate-100">{scenario.title}</h1>
        </div>
        <p className="text-sm text-slate-400">{scenario.short}</p>
      </div>

      {/* Waveforms: pinned to top on mobile so they stay visible while adjusting controls below */}
      <div className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur rounded-lg py-1 xl:static xl:bg-transparent xl:py-0">
        <SimStage minH={300} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Teaching (left on desktop, below controls on mobile) */}
        <div className="order-3 xl:order-1 xl:col-span-2 space-y-3 min-w-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Panel title="Mechanism">
              <p className="text-sm leading-relaxed text-slate-300">{scenario.mechanism}</p>
            </Panel>
            <div className="space-y-3">
              <Panel title="Recognise it">
                <ul className="space-y-1.5">
                  {scenario.recognize.map((r, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-300">
                      <span className="text-amber-400 mt-0.5">◆</span>
                      <span className="leading-snug">{r}</span>
                    </li>
                  ))}
                </ul>
              </Panel>
              <Panel title="Fix it">
                <ul className="space-y-1.5">
                  {scenario.fix.map((r, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-300">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      <span className="leading-snug">{r}</span>
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>
          </div>
          <ReferenceList ids={scenario.refIds} />
        </div>

        {/* Live controls to experiment with the fix */}
        <div className="order-2 xl:order-2 space-y-3 min-w-0">
          <p className="text-xs text-slate-400 leading-snug">
            The scenario is loaded live. Adjust the controls and watch the waveforms respond — then
            head to <span className="text-sky-300">Challenges</span> to be tested.
          </p>
          <ControlPanel />
          <PatientPanel />
        </div>
      </div>
    </div>
  )
}
