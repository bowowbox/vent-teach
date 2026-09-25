import { useState } from 'react'
import { useSession } from '../session/sessionStore'
import { CODE_LENGTH, isCompleteCode, normalizeCode } from '../session/code'
import { isFirebaseConfigured } from '../firebase'
import { useUI } from '../i18n'

// Entry point for the Session tab: pick a role, or type a code to join one.
//
// If no Firebase project is configured the tab explains what is missing instead of
// offering buttons that cannot work. Everything else in the app runs without it, so this
// must degrade rather than break.

export function SessionLobby() {
  const status = useSession((s) => s.status)
  const error = useSession((s) => s.error)
  const createSession = useSession((s) => s.createSession)
  const joinSession = useSession((s) => s.joinSession)
  const ui = useUI()
  const [code, setCode] = useState('')

  const busy = status === 'connecting'

  if (!isFirebaseConfigured()) {
    return (
      <div className="max-w-2xl mx-auto p-5">
        <div className="rounded-xl bg-amber-500/10 ring-1 ring-amber-500/30 p-4">
          <h2 className="text-sm font-semibold text-amber-100 mb-1.5">{ui.session.setupTitle}</h2>
          <p className="text-xs leading-relaxed text-amber-100/80">{ui.session.setupText}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-5 space-y-4">
      <div>
        <h2 className="text-base font-bold text-slate-100">{ui.session.lobbyTitle}</h2>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{ui.session.lobbyIntro}</p>
      </div>

      {error ? (
        <p className="rounded-lg bg-rose-500/10 ring-1 ring-rose-500/30 px-3 py-2 text-xs text-rose-100">
          {error === 'notFound' ? ui.session.errNotFound : ui.session.errConnect}
        </p>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <section className="rounded-xl bg-slate-900/70 ring-1 ring-slate-800 p-3.5 space-y-2.5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {ui.session.instructor}
          </h3>
          <button
            onClick={() => void createSession()}
            disabled={busy}
            className="w-full rounded-lg bg-sky-500 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-400 transition disabled:opacity-50"
          >
            {busy ? ui.session.connecting : ui.session.startInstructor}
          </button>
        </section>

        <section className="rounded-xl bg-slate-900/70 ring-1 ring-slate-800 p-3.5 space-y-2.5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {ui.session.learner}
          </h3>
          <label className="block">
            <span className="sr-only">{ui.session.codeLabel}</span>
            <input
              type="text"
              inputMode="text"
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              maxLength={CODE_LENGTH}
              value={code}
              onChange={(e) => setCode(normalizeCode(e.target.value))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && isCompleteCode(code)) void joinSession(code)
              }}
              placeholder={'–'.repeat(CODE_LENGTH)}
              aria-label={ui.session.codeLabel}
              className="w-full rounded-lg bg-slate-800 px-3 py-2 text-center tabular text-lg font-semibold
                         tracking-[0.3em] text-sky-300 placeholder:text-slate-600 placeholder:tracking-[0.3em]
                         ring-1 ring-slate-700 focus:ring-sky-500 focus:outline-none transition"
            />
          </label>
          <button
            onClick={() => void joinSession(code)}
            disabled={busy || !isCompleteCode(code)}
            className="w-full rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 transition disabled:opacity-40"
          >
            {busy ? ui.session.connecting : ui.session.joinLearner}
          </button>
        </section>
      </div>
    </div>
  )
}
