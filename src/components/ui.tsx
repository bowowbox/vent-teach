import type { ReactNode } from 'react'

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
  hint,
  danger,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (v: number) => void
  hint?: string
  danger?: boolean
}) {
  return (
    <label className="block select-none">
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-xs font-medium text-slate-300">{label}</span>
        <span
          className={`tabular text-sm font-semibold ${
            danger ? 'text-rose-400' : 'text-sky-300'
          }`}
        >
          {value}
          {unit ? <span className="text-[10px] text-slate-400 ml-0.5">{unit}</span> : null}
        </span>
      </div>
      <input
        type="range"
        className="w-full"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
      {hint ? <p className="mt-1 text-[10px] leading-tight text-slate-500">{hint}</p> : null}
    </label>
  )
}

export function SegGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label?: string
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div>
      {label ? <div className="text-xs font-medium text-slate-300 mb-1">{label}</div> : null}
      <div className="inline-flex flex-wrap gap-1 rounded-lg bg-slate-800/60 p-1">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
              value === o.value
                ? 'bg-sky-500 text-slate-950 shadow'
                : 'text-slate-300 hover:bg-slate-700/60'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function Panel({
  title,
  children,
  right,
}: {
  title?: string
  children: ReactNode
  right?: ReactNode
}) {
  return (
    <section className="rounded-xl bg-slate-900/70 ring-1 ring-slate-800 p-3">
      {title ? (
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {title}
          </h3>
          {right}
        </div>
      ) : null}
      {children}
    </section>
  )
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 text-xs font-medium text-slate-300"
    >
      <span
        className={`relative inline-block w-9 h-5 rounded-full transition ${
          checked ? 'bg-sky-500' : 'bg-slate-700'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition ${
            checked ? 'translate-x-4' : ''
          }`}
        />
      </span>
      {label}
    </button>
  )
}
