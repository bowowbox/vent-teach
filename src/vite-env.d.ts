/// <reference types="vite/client" />

// Firebase web config for the teaching-session tab. These are public client
// identifiers, not secrets — they are readable in any deployed bundle. They live in env
// vars so the app can be pointed at a different project (or none) without a code change.
interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY?: string
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string
  readonly VITE_FIREBASE_DATABASE_URL?: string
  readonly VITE_FIREBASE_PROJECT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
