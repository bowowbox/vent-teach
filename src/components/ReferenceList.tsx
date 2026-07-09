import { ref } from '../content/references'

export function ReferenceList({ ids, title = 'Evidence & further reading' }: { ids: string[]; title?: string }) {
  if (!ids.length) return null
  return (
    <div className="rounded-xl bg-slate-900/50 ring-1 ring-slate-800 p-3">
      <h4 className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-2">
        {title}
      </h4>
      <ul className="space-y-2">
        {ids.map((id) => {
          const r = ref(id)
          return (
            <li key={id} className="text-xs leading-snug text-slate-400">
              <span className="text-slate-300">{r.authors}</span> ({r.year}).{' '}
              <span className="italic text-slate-300">{r.title}</span>. {r.journal}.
              {r.doi ? (
                <>
                  {' '}
                  <a
                    href={`https://doi.org/${r.doi}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-400 hover:text-sky-300 underline decoration-dotted"
                  >
                    doi:{r.doi}
                  </a>
                </>
              ) : null}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
