// Lazy Firebase Realtime Database access.
//
// The whole SDK is behind a dynamic import() so Vite code-splits it into its own chunk:
// firebase/app + firebase/database is about the size of the rest of the app, and the
// four other tabs must not pay for a feature they never touch. Nothing here is imported
// at module scope by anything the initial bundle reaches.

import type { Database } from 'firebase/database'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
}

/**
 * Whether a database is configured at all. The Session tab renders setup instructions
 * instead of a lobby when this is false, so a fresh clone or a local dev run without a
 * .env stays usable rather than crashing.
 *
 * databaseURL is the only field the Realtime Database actually needs to route a request;
 * apiKey is checked too so a half-filled .env reads as unconfigured rather than failing
 * at connect time with something cryptic.
 */
export function isSessionConfigured(): boolean {
  return Boolean(config.databaseURL && config.apiKey)
}

let dbPromise: Promise<Database> | null = null

/** Resolves the shared Database handle, initialising the SDK on first call. */
export function getDb(): Promise<Database> {
  if (!isSessionConfigured()) {
    return Promise.reject(new Error('Firebase is not configured'))
  }
  // Cached at module scope: getDb() is called from every publish and subscribe, and
  // initializeApp must happen exactly once per page load.
  if (!dbPromise) {
    dbPromise = (async () => {
      const [{ initializeApp, getApps, getApp }, { getDatabase }] = await Promise.all([
        import('firebase/app'),
        import('firebase/database'),
      ])
      // getApps() guard keeps a dev-server hot reload from throwing on a duplicate app.
      const app = getApps().length ? getApp() : initializeApp(config)
      return getDatabase(app)
    })().catch((err) => {
      dbPromise = null // let a later attempt retry rather than caching the failure
      throw err
    })
  }
  return dbPromise
}

/** The `firebase/database` function namespace, loaded on demand. */
export function getDbApi() {
  return import('firebase/database')
}
