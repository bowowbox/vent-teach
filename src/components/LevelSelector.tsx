import { useSim } from '../store/simStore'
import type { LearnerLevel } from '../store/simStore'

const LEVELS: { value: LearnerLevel; label: string }[] = [
  { value: 'student', label: 'Student' },
  { value: 'nurse', label: 'Nurse' },
  { value: 'resident', label: 'Resident' },
]

export function LevelSelector() {
  const level = useSim((s) => s.level)
  const setLevel = useSim((s) => s.setLevel)
  return (
    <div className="flex items-center gap-2">
      <span className="hidden sm:inline text-[10px] uppercase tracking-wide text-slate-500">
        Learner
      </span>
      <div className="inline-flex gap-1 rounded-lg bg-slate-800/60 p-1">
        {LEVELS.map((l) => (
          <button
            key={l.value}
            onClick={() => setLevel(l.value)}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
              level === l.value
                ? 'bg-sky-500 text-slate-950'
                : 'text-slate-300 hover:bg-slate-700/60'
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>
    </div>
  )
}
