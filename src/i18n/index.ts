import { useCallback } from 'react'
import { create } from 'zustand'
import { strings, type UIStrings } from './strings'
import type { Lang, LS } from './types'

const STORAGE_KEY = 'venteach.lang'

/** Saved choice wins; otherwise a Thai-preferring browser lands on Thai. */
function detectLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'en' || saved === 'th') return saved
  } catch {
    // localStorage can throw in private mode; fall through to detection.
  }
  if (typeof navigator === 'undefined') return 'en'
  const prefs = navigator.languages?.length ? navigator.languages : [navigator.language]
  return prefs.some((l) => l?.toLowerCase().startsWith('th')) ? 'th' : 'en'
}

function applyDocumentLang(lang: Lang) {
  if (typeof document !== 'undefined') document.documentElement.lang = lang
}

interface LangStore {
  lang: Lang
  setLang: (lang: Lang) => void
}

export const useLangStore = create<LangStore>((set) => ({
  lang: detectLang(),
  setLang: (lang) => {
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      // Non-persistent is still usable for this session.
    }
    applyDocumentLang(lang)
    set({ lang })
  },
}))

applyDocumentLang(useLangStore.getState().lang)

export const useLang = (): Lang => useLangStore((s) => s.lang)
export const useSetLang = () => useLangStore((s) => s.setLang)

/** Resolve a bilingual string outside React. */
export const t = (s: LS, lang: Lang): string => s[lang]

/** Resolve bilingual content strings in the active language. */
export function useT(): (s: LS) => string {
  const lang = useLang()
  return useCallback((s: LS) => s[lang], [lang])
}

/** UI chrome strings in the active language. */
export function useUI(): UIStrings {
  return strings[useLang()]
}

export type { UIStrings, Lang, LS }
