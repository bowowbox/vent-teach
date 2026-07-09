import { useState } from 'react'
import { WaveformDisplay } from './components/WaveformDisplay'
import { ControlPanel } from './components/ControlPanel'
import { PatientPanel } from './components/PatientPanel'
import { TelemetryBar } from './components/TelemetryBar'
import { PlaybackBar } from './components/PlaybackBar'
import { LearnView } from './views/LearnView'
import { DyssynchronyView } from './views/DyssynchronyView'
import { ChallengeView } from './views/ChallengeView'
import { AboutView } from './views/AboutView'
import { LangToggle } from './components/LangToggle'
import { useUI } from './i18n'

type View = 'learn' | 'sandbox' | 'dyssynchrony' | 'challenges' | 'about'

const NAV: { id: View; icon: string }[] = [
  { id: 'learn', icon: '📘' },
  { id: 'sandbox', icon: '🎛️' },
  { id: 'dyssynchrony', icon: '⚡' },
  { id: 'challenges', icon: '🎯' },
  { id: 'about', icon: 'ℹ️' },
]

export function App() {
  const [view, setView] = useState<View>('learn')
  const ui = useUI()

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <header className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 border-b border-slate-800 bg-slate-900/60 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🫁</span>
          <div>
            <h1 className="text-sm font-bold text-slate-100 leading-none">VentTeach</h1>
            <p className="text-[10px] text-slate-500 leading-tight">{ui.app.tagline}</p>
          </div>
        </div>
        <LangToggle />
      </header>

      <div className="flex flex-1 min-h-0 flex-col sm:flex-row">
        {/* Left rail on tablet/desktop; bottom tab bar on mobile. */}
        <nav
          className="order-last sm:order-none shrink-0 flex sm:flex-col w-full sm:w-44
                     border-t sm:border-t-0 sm:border-r border-slate-800 bg-slate-900/60 sm:bg-slate-900/40
                     justify-around sm:justify-start gap-1 p-1 sm:p-2"
        >
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setView(n.id)}
              className={`flex-1 sm:flex-none flex flex-col sm:flex-row items-center sm:gap-2.5 gap-0.5
                          rounded-lg px-1 sm:px-2.5 py-1.5 sm:py-2 text-sm font-medium transition ${
                            view === n.id
                              ? 'bg-sky-500/15 text-sky-200 sm:ring-1 sm:ring-sky-500/40'
                              : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                          }`}
            >
              <span className="text-lg sm:text-base">{n.icon}</span>
              <span className="text-[10px] sm:text-sm leading-none">{ui.nav[n.id]}</span>
            </button>
          ))}
        </nav>

        <main className="flex-1 min-w-0 min-h-0 overflow-y-auto overflow-x-hidden">
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
    <div className="flex flex-col lg:flex-row gap-3 p-2.5 sm:p-3 lg:h-full">
      <div className="flex-1 min-w-0 flex flex-col gap-3">
        <TelemetryBar />
        <div className="h-[44vh] min-h-[280px] lg:h-auto lg:flex-1">
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
