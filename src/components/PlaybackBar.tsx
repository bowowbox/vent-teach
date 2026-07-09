import { useSim } from '../store/simStore'
import { Toggle } from './ui'
import { useUI } from '../i18n'

export function PlaybackBar() {
  const ui = useUI()
  const running = useSim((s) => s.running)
  const speed = useSim((s) => s.speed)
  const showPmus = useSim((s) => s.showPmus)
  const toggleRunning = useSim((s) => s.toggleRunning)
  const setSpeed = useSim((s) => s.setSpeed)
  const setShowPmus = useSim((s) => s.setShowPmus)
  const resetSim = useSim((s) => s.resetSim)

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <button
        onClick={toggleRunning}
        className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500 px-3 py-1.5 text-sm font-semibold text-slate-950 hover:bg-sky-400 transition"
      >
        {running ? `❚❚ ${ui.playback.pause}` : `▶ ${ui.playback.play}`}
      </button>
      <button
        onClick={resetSim}
        className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium text-slate-200 hover:bg-slate-700 transition"
      >
        ↺ {ui.playback.reset}
      </button>

      <div className="flex items-center gap-1 rounded-lg bg-slate-800/60 p-1">
        {[0.5, 1, 2].map((sp) => (
          <button
            key={sp}
            onClick={() => setSpeed(sp)}
            className={`px-2 py-1 text-xs font-medium rounded-md transition ${
              speed === sp ? 'bg-sky-500 text-slate-950' : 'text-slate-300 hover:bg-slate-700/60'
            }`}
          >
            {sp}×
          </button>
        ))}
      </div>

      <Toggle label={ui.playback.showPmus} checked={showPmus} onChange={setShowPmus} />
    </div>
  )
}
