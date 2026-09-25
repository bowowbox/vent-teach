import { useRef, useState } from 'react'
import { isFirebaseConfigured } from '../firebase'
import { submitFeedback, MAX_MESSAGE } from '../feedback/submit'
import { useLang, useUI } from '../i18n'

// A feedback box reachable from every tab.
//
// Built on the native <dialog> element rather than a fixed overlay div: it brings a focus
// trap, Esc-to-close and a real backdrop for free, all of which a hand-rolled modal would
// have to implement. Styling for ::backdrop lives in index.css.
//
// Renders nothing at all when no database is configured — there is no point offering a
// button that cannot work on an unconfigured build.

type Status = 'idle' | 'sending' | 'sent' | 'error'

export function FeedbackDialog({ view }: { view: string }) {
  const ref = useRef<HTMLDialogElement>(null)
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const lang = useLang()
  const ui = useUI()

  if (!isFirebaseConfigured()) return null

  const open = () => {
    setStatus('idle')
    ref.current?.showModal()
  }

  const close = () => {
    ref.current?.close()
    // Clear only after a successful send, so a failed attempt keeps what was typed.
    if (status === 'sent') {
      setMessage('')
      setEmail('')
    }
    setStatus('idle')
  }

  const send = async () => {
    if (!message.trim() || status === 'sending') return
    // Honeypot: humans never see this field, so anything in it came from a bot. Report
    // success rather than an error, which gives a script nothing to tune against.
    if (honeypot) {
      setStatus('sent')
      return
    }
    setStatus('sending')
    try {
      await submitFeedback({ message, email, view, lang })
      setStatus('sent')
    } catch {
      setStatus('error')
    }
  }

  return (
    <>
      <button
        onClick={open}
        className="flex items-center gap-1.5 rounded-lg bg-slate-800/60 px-2 py-1 text-xs font-medium
                   text-slate-300 hover:bg-slate-700/60 hover:text-slate-100 transition"
        aria-label={ui.feedback.button}
      >
        <span aria-hidden="true">💬</span>
        {/* Label hidden on the narrowest screens: the header is tight at 320px. */}
        <span className="hidden sm:inline">{ui.feedback.button}</span>
      </button>

      <dialog
        ref={ref}
        // A click landing on the dialog itself rather than its children is a backdrop click.
        onClick={(e) => {
          if (e.target === ref.current) close()
        }}
        onClose={close}
        className="w-[min(30rem,calc(100vw-2rem))] rounded-xl bg-slate-900 ring-1 ring-slate-700 p-4 text-slate-200"
      >
        <h2 className="text-sm font-bold text-slate-100">{ui.feedback.title}</h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-400">{ui.feedback.intro}</p>

        {status === 'sent' ? (
          <div className="mt-4 space-y-3">
            <p className="rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/40 px-3 py-2 text-xs text-emerald-100">
              {ui.feedback.thanks}
            </p>
            <div className="flex justify-end">
              <button
                onClick={close}
                className="rounded-lg bg-sky-500 px-3 py-1.5 text-sm font-semibold text-slate-950 hover:bg-sky-400 transition"
              >
                {ui.feedback.close}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            <label className="block">
              <span className="text-xs font-medium text-slate-300">{ui.feedback.messageLabel}</span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={MAX_MESSAGE}
                rows={5}
                placeholder={ui.feedback.messagePlaceholder}
                className="mt-1 w-full resize-y rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-100
                           placeholder:text-slate-600 ring-1 ring-slate-700 focus:ring-sky-500
                           focus:outline-none transition"
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium text-slate-300">{ui.feedback.emailLabel}</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="mt-1 w-full rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-100
                           placeholder:text-slate-600 ring-1 ring-slate-700 focus:ring-sky-500
                           focus:outline-none transition"
              />
            </label>

            {/* Honeypot. Off-screen rather than display:none, which some bots detect. */}
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              className="absolute left-[-9999px] w-px h-px opacity-0"
            />

            <p className="text-[10px] leading-tight text-slate-500">{ui.feedback.contextNote}</p>

            {status === 'error' ? (
              <p className="rounded-lg bg-rose-500/10 ring-1 ring-rose-500/30 px-3 py-2 text-xs text-rose-100">
                {ui.feedback.error}
              </p>
            ) : null}

            <div className="flex justify-end gap-2">
              <button
                onClick={close}
                className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium text-slate-200 hover:bg-slate-700 transition"
              >
                {ui.feedback.cancel}
              </button>
              <button
                onClick={() => void send()}
                disabled={!message.trim() || status === 'sending'}
                className="rounded-lg bg-sky-500 px-3 py-1.5 text-sm font-semibold text-slate-950
                           hover:bg-sky-400 transition disabled:opacity-40"
              >
                {status === 'sending' ? ui.feedback.sending : ui.feedback.send}
              </button>
            </div>
          </div>
        )}
      </dialog>
    </>
  )
}
