export type Lang = 'en' | 'th'

/**
 * A string carried in both languages. Inside `th`, ventilator and physiology
 * terms are deliberately left in English — that is what is printed on the
 * machine at the bedside and what Thai clinicians say out loud.
 */
export interface LS {
  en: string
  th: string
}
