import { useEffect, useMemo, useState } from 'react'
import { scenarios, type Scenario } from '../content/scenarios'
import { useSim } from '../store/simStore'
import { SimStage } from '../components/SimStage'
import { ControlPanel } from '../components/ControlPanel'
import { PatientPanel } from '../components/PatientPanel'
import { Panel } from '../components/ui'

export function ChallengeView() {
  const [idx, setIdx] = useState(0)
  const [phase, setPhase] = useState<'identify' | 'fix'>('identify')
  const [picked, setPicked] = useState<string | null>(null)
  const applySettings = useSim((s) => s.applySettings)
  const setRunning = useSim((s) => s.setRunning)
  const settings = useSim((s) => s.settings)

  const scenario = scenarios[idx]
  const resolved = useMemo(() => scenario.check(settings), [scenario, settings])

  const loadChallenge = (i: number) => {
    setIdx(i)
    setPhase('identify')
    setPicked(null)
    applySettings(scenarios[i].settings)
    setRunning(true)
  }

  useEffect(() => {
    applySettings(scenario.settings)
    setRunning(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Build identify options: correct answer + distractors from other scenarios.
  const options = useMemo(() => shuffle([scenario, ...pickDistractors(scenario)].map((s) => s.title)), [idx])

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-slate-300 mr-1">Challenge</span>
        {scenarios.map((s, i) => (
          <button
            key={s.id}
            onClick={() => loadChallenge(i)}
            className={`w-7 h-7 rounded-full text-xs font-semibold transition ${
              i === idx ? 'bg-sky-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4 min-w-0">
          <div className="rounded-xl bg-slate-900/70 ring-1 ring-slate-800 p-3">
            <p className="text-sm text-slate-300">
              <span className="font-semibold text-slate-100">Bedside brief:</span> This patient’s
              waveforms look wrong. Diagnose the problem, then adjust the ventilator to resolve it.
            </p>
          </div>

          <SimStage minH={320} />

          {phase === 'identify' && (
            <Panel title="Step 1 · What are you looking at?">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {options.map((opt) => {
                  const isCorrect = opt === scenario.title
                  const isPicked = picked === opt
                  const show = picked !== null
                  return (
                    <button
                      key={opt}
                      disabled={show}
                      onClick={() => setPicked(opt)}
                      className={`text-left rounded-lg px-3 py-2 text-sm ring-1 transition ${
                        show && isCorrect
                          ? 'bg-emerald-500/15 ring-emerald-500/50 text-emerald-100'
                          : isPicked
                            ? 'bg-rose-500/15 ring-rose-500/50 text-rose-100'
                            : 'bg-slate-800/60 ring-slate-700 text-slate-200 hover:bg-slate-700/60'
                      }`}
                    >
                      {opt}
                      {show && isCorrect ? ' ✓' : ''}
                      {show && isPicked && !isCorrect ? ' ✗' : ''}
                    </button>
                  )
                })}
              </div>
              {picked && (
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-sm text-slate-300">
                    {picked === scenario.title
                      ? 'Correct — now resolve it using the controls.'
                      : `Not quite. This is ${scenario.title.toLowerCase()}. Read the mechanism, then fix it.`}
                  </p>
                  <button
                    onClick={() => setPhase('fix')}
                    className="shrink-0 rounded-lg bg-sky-500 px-3 py-1.5 text-sm font-semibold text-slate-950 hover:bg-sky-400"
                  >
                    Fix it →
                  </button>
                </div>
              )}
            </Panel>
          )}

          {phase === 'fix' && (
            <Panel title="Step 2 · Resolve the asynchrony">
              <div
                className={`rounded-lg p-3 ring-1 transition ${
                  resolved
                    ? 'bg-emerald-500/15 ring-emerald-500/50'
                    : 'bg-slate-800/50 ring-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`inline-block w-2.5 h-2.5 rounded-full ${
                      resolved ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
                    }`}
                  />
                  <span className={`text-sm font-semibold ${resolved ? 'text-emerald-200' : 'text-amber-200'}`}>
                    {resolved ? 'Resolved' : 'Not resolved yet'}
                  </span>
                </div>
                <p className="text-sm text-slate-300 leading-snug">
                  {resolved ? scenario.successText : 'Use the ventilator and patient controls to correct the problem. This panel updates live.'}
                </p>
              </div>
              <details className="mt-3">
                <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-200">
                  Show a hint
                </summary>
                <ul className="mt-2 space-y-1.5">
                  {scenario.fix.map((f, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-300">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      <span className="leading-snug">{f}</span>
                    </li>
                  ))}
                </ul>
              </details>
            </Panel>
          )}
        </div>

        <div className="space-y-3 min-w-0">
          <ControlPanel />
          <PatientPanel />
        </div>
      </div>
    </div>
  )
}

function pickDistractors(correct: Scenario): Scenario[] {
  return scenarios.filter((s) => s.id !== correct.id).slice(0, 3)
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
