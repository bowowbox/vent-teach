import { useSim } from '../store/simStore'

function Metric({
  label,
  value,
  unit,
  tone = 'default',
}: {
  label: string
  value: string | number
  unit?: string
  tone?: 'default' | 'warn' | 'good'
}) {
  const color =
    tone === 'warn' ? 'text-rose-400' : tone === 'good' ? 'text-emerald-400' : 'text-slate-100'
  return (
    <div className="flex flex-col items-center px-3 py-1.5 min-w-[74px]">
      <span className="text-[10px] uppercase tracking-wide text-slate-500">{label}</span>
      <span className={`tabular text-lg font-semibold leading-tight ${color}`}>{value}</span>
      {unit ? <span className="text-[9px] text-slate-500">{unit}</span> : null}
    </div>
  )
}

export function TelemetryBar() {
  const t = useSim((s) => s.telemetry)
  const mode = useSim((s) => s.settings.vent.mode)
  const plateauWarn = t.plateauPressure > 30
  const autoPeepWarn = t.autoPeep >= 3

  return (
    <div className="flex flex-wrap items-center justify-around gap-y-1 rounded-xl bg-slate-900/70 ring-1 ring-slate-800 py-1 px-1">
      <Metric label="Ppeak" value={t.peakPressure} unit="cmH₂O" />
      <Metric
        label="Pplat"
        value={t.plateauPressure}
        unit="cmH₂O"
        tone={plateauWarn ? 'warn' : 'default'}
      />
      <Metric label="Vt (exp)" value={t.measuredTidalVolume} unit="mL" />
      <Metric label="Total RR" value={t.totalRate} unit="/min" />
      <Metric
        label="Auto-PEEP"
        value={t.autoPeep}
        unit="cmH₂O"
        tone={autoPeepWarn ? 'warn' : 'default'}
      />
      {mode === 'VC-AC' ? <Metric label="Ti" value={t.inspTime} unit="s" /> : null}
      <Metric label="I:E" value={t.ieRatio} />
      <Metric label="MinVent" value={t.minuteVentilation} unit="L/min" />
    </div>
  )
}
