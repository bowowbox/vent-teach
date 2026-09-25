import { getDb, getDbApi } from '../firebase'

// Feedback goes to a /feedback node in the same database the Session tab uses, and is read
// in the Firebase console (Realtime Database -> Data -> feedback). The rules make that node
// create-only and unreadable from any client, so a visitor can submit but nobody — not even
// the submitter — can read anything back. See the Session section of README.md.

/** Matches the `.validate` cap in the database rules; enforced here so a write never bounces. */
export const MAX_MESSAGE = 2000

export interface FeedbackEntry {
  message: string
  /** Optional: only so the author can reply. Omitted entirely when blank. */
  email?: string
  /** Which tab the visitor was on — the single most useful field for reproducing a bug. */
  view: string
  lang: string
}

/**
 * Writes one feedback entry. Rejects an empty message rather than storing a blank row.
 * Resolves on success; throws so the dialog can keep the typed text and show an error.
 */
export async function submitFeedback(entry: FeedbackEntry): Promise<void> {
  const message = entry.message.trim().slice(0, MAX_MESSAGE)
  if (!message) throw new Error('empty')

  const email = entry.email?.trim()

  const payload: Record<string, string | number> = {
    message,
    view: entry.view,
    lang: entry.lang,
    // Coarse client hint for reproducing rendering bugs. Truncated: some user-agent
    // strings are enormous and none of the tail is useful.
    ua: navigator.userAgent.slice(0, 300),
    at: Date.now(),
  }
  // Firebase rejects undefined outright, so an absent email must be an absent key.
  if (email) payload.email = email.slice(0, 200)

  const [db, api] = await Promise.all([getDb(), getDbApi()])
  // push() keys are time-ordered, so the console lists submissions oldest to newest.
  await api.push(api.ref(db, 'feedback'), payload)
}
