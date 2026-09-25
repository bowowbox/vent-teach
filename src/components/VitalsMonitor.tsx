import { useSession } from '../session/sessionStore'

// The strip above the bed. Read-only on both sides: the instructor authors these numbers
// in VitalsPanel, the learner only reads them. Colour follows the app's existing
// vocabulary — rose for a value that should worry you, amber for borderline.

type Tone = 'default' | 'warn' | 'bad'

function toneClass(tone: Tone): string {
  if (tone === 'bad') return 'text-rose-400'
  if (tone === 'warn') return 'text-amber-400'
  return 'text-slate-100'
}

function Vital({
  label,
  value,
  unit,
  tone = 'default',
}: {
  label: string
  value: string | number
  unit?: string
  tone?: Tone
}) {
  return (
    <div className="flex flex-col items-center px-3 py-1.5 min-w-[74px]">
      <span className="text-[10px] uppercase tracking-wide text-slate-500">{label}</span>
      <span className={`tabular text-lg font-semibold leading-tight ${toneClass(tone)}`}>
        {value}
      </span>
      {unit ? <span className="text-[9px] text-slate-500">{unit}</span> : null}
    </div>
  )
}

// Thresholds are the ordinary bedside ones — enough to make a deteriorating patient read
// as deteriorating without pretending to be a scoring system.
function spo2Tone(v: number): Tone {
  if (v < 90) return 'bad'
  if (v < 94) return 'warn'
  return 'default'
}

function hrTone(v: number): Tone {
  if (v > 130 || v < 50) return 'bad'
  if (v > 110 || v < 55) return 'warn'
  return 'default'
}

function mapTone(sys: number, dia: number): Tone {
  const map = (sys + 2 * dia) / 3
  if (map < 60) return 'bad'
  if (map < 65) return 'warn'
  return 'default'
}

function rrTone(v: number): Tone {
  if (v > 30 || v < 8) return 'bad'
  if (v > 24) return 'warn'
  return 'default'
}

function tempTone(v: number): Tone {
  if (v >= 39 || v < 35) return 'bad'
  if (v >= 38) return 'warn'
  return 'default'
}

export function VitalsMonitor() {
  // Instructor: the values they are authoring. Learner: the values received. Same node,
  // opposite directions — the ownership rule keeps them from fighting.
  const v = useSession((s) => s.vitals)

  return (
    <div className="flex flex-wrap items-center justify-around gap-y-1 rounded-xl bg-slate-900/70 ring-1 ring-slate-800 py-1 px-1">
      <Vital label="HR" value={v.hr} unit="/min" tone={hrTone(v.hr)} />
      <Vital
        label="BP"
        value={`${v.sysBP}/${v.diaBP}`}
        unit="mmHg"
        tone={mapTone(v.sysBP, v.diaBP)}
      />
      <Vital label="SpO₂" value={v.spo2} unit="%" tone={spo2Tone(v.spo2)} />
      <Vital label="RR" value={v.rr} unit="/min" tone={rrTone(v.rr)} />
      <Vital label="Temp" value={v.temp.toFixed(1)} unit="°C" tone={tempTone(v.temp)} />
    </div>
  )
}
