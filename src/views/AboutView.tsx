import { references } from '../content/references'
import { ReferenceList } from '../components/ReferenceList'
import { useUI } from '../i18n'

export function AboutView() {
  const allIds = Object.keys(references)
  const ui = useUI()

  return (
    <div className="max-w-3xl mx-auto p-5 space-y-5">
      <header>
        <h1 className="text-xl font-bold text-slate-100">{ui.about.title}</h1>
        <p className="text-sm text-slate-400 mt-1">{ui.about.intro}</p>
      </header>

      <section className="rounded-xl bg-rose-500/10 ring-1 ring-rose-500/30 p-4">
        <h2 className="text-sm font-semibold text-rose-100 mb-1">{ui.about.disclaimerTitle}</h2>
        <p className="text-sm text-rose-100/90 leading-relaxed">{ui.about.disclaimer}</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-sky-300">{ui.about.howTitle}</h2>
        <p className="text-sm text-slate-300 leading-relaxed">{ui.about.howText}</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-sky-300">{ui.about.teachTitle}</h2>
        <ul className="space-y-1.5">
          {ui.about.teachItems.map((x, i) => (
            <li key={i} className="flex gap-2 text-sm text-slate-300">
              <span className="text-sky-500 mt-0.5">▸</span>
              <span className="leading-snug">{x}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-slate-500 leading-relaxed pt-1">{ui.about.teachNote}</p>
        <p className="text-xs text-slate-500 leading-relaxed">{ui.about.langNote}</p>
      </section>

      <ReferenceList ids={allIds} title={ui.refs.fullLibrary} />

      <footer className="text-xs text-slate-600 pt-2">{ui.about.footer}</footer>
    </div>
  )
}
