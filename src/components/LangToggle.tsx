import { useLang, useSetLang, useUI, type Lang } from '../i18n'

const OPTIONS: { value: Lang; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'th', label: 'ไทย' },
]

export function LangToggle() {
  const lang = useLang()
  const setLang = useSetLang()
  const ui = useUI()

  return (
    <div
      role="group"
      aria-label={ui.app.langLabel}
      className="inline-flex items-center gap-0.5 rounded-lg bg-slate-800/60 p-0.5"
    >
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          onClick={() => setLang(o.value)}
          aria-pressed={lang === o.value}
          className={`rounded-md px-2 py-1 text-xs font-semibold transition ${
            lang === o.value
              ? 'bg-sky-500 text-slate-950'
              : 'text-slate-300 hover:bg-slate-700/60'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
