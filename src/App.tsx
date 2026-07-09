import { useState } from 'react'
import { WaveformDisplay } from './components/WaveformDisplay'
import { ControlPanel } from './components/ControlPanel'
import { PatientPanel } from './components/PatientPanel'
import { TelemetryBar } from './components/TelemetryBar'
import { PlaybackBar } from './components/PlaybackBar'
import { LevelSelector } from './components/LevelSelector'
import { LearnView } from './views/LearnView'
import { DyssynchronyView } from './views/DyssynchronyView'
import { ChallengeView } from './views/ChallengeView'
import { AboutView } from './views/AboutView'

type View = 'learn' | 'sandbox' | 'dyssynchrony' | 'challenges' | 'about'

const NAV: { id: View; label: string; icon: string }[] = [
  { id: 'learn', label: 'Learn', icon: '📘' },
  { id: 'sandbox', label: 'Sandbox', icon: '🎛️' },
  { id: 'dyssynchrony', label: 'Dyssynchrony', icon: '⚡' },
  { id: 'challenges', label: 'Challenges', icon: '🎯' },
  { id: 'about', label: 'About', icon: 'ℹ️' },
]

export function App() {
  const [view, setView] = useState<View>('learn')

  return (
    <div className="h-full flex flex-col">
      <header className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-slate-900/60 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🫁</span>
          <div>
            <h1 className="text-sm font-bold text-slate-100 leading-none">VentTeach</h1>
            <p className="text-[10px] text-slate-500 leading-tight">
              Ventilator settings & patient–ventilator dyssynchrony
            </p>
          </div>
        </div>
        <LevelSelector />
      </header>

      <div className="flex flex-1 min-h-0">
        <nav className="w-14 sm:w-44 shrink-0 border-r border-slate-800 bg-slate-900/40 p-2 space-y-1">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setView(n.id)}
              className={`w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition ${
                view === n.id
                  ? 'bg-sky-500/15 text-sky-200 ring-1 ring-sky-500/40'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <span className="text-base">{n.icon}</span>
              <span className="hidden sm:inline">{n.label}</span>
            </button>
          ))}
        </nav>

        <main className="flex-1 min-w-0 overflow-y-auto">
          {view === 'sandbox' && <SandboxLayout />}
          {view === 'learn' && <LearnView />}
          {view === 'dyssynchrony' && <DyssynchronyView />}
          {view === 'challenges' && <ChallengeView />}
          {view === 'about' && <AboutView />}
        </main>
      </div>
    </div>
  )
}

/** Full-width free-play simulator: waveforms + telemetry + all controls. */
export function SandboxLayout() {
  return (
    <div className="h-full flex flex-col lg:flex-row gap-3 p-3">
      <div className="flex-1 min-w-0 flex flex-col gap-3">
        <TelemetryBar />
        <div className="flex-1 min-h-[320px]">
          <WaveformDisplay />
        </div>
        <PlaybackBar />
      </div>
      <div className="w-full lg:w-[360px] shrink-0 space-y-3 lg:overflow-y-auto">
        <ControlPanel />
        <PatientPanel />
      </div>
    </div>
  )
}
