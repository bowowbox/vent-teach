// Session join codes. Read aloud across a room, typed on a phone — so the alphabet
// drops every character that gets confused when spoken or squinted at: I, L, O, 0 and 1.
// 31 symbols, 6 places ≈ 8.9e8 codes.

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
const LENGTH = 6

export function generateCode(): string {
  // crypto.getRandomValues avoids the clustering you can get from Math.random in a loop,
  // and is available in every browser this app targets.
  const bytes = new Uint8Array(LENGTH)
  crypto.getRandomValues(bytes)
  let out = ''
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length]
  return out
}

/**
 * Accept what a human actually types — lower case, stray spaces or dashes — and drop
 * anything that cannot appear in a code.
 *
 * Deliberately does NOT "repair" look-alikes (O→Q, I→J, …). A silent substitution can
 * turn a misread character into a different *valid* code and drop someone into a
 * stranger's session; a plain "session not found" is better feedback than that.
 */
export function normalizeCode(raw: string): string {
  return raw
    .toUpperCase()
    .split('')
    .filter((c) => ALPHABET.includes(c))
    .join('')
    .slice(0, LENGTH)
}

export function isCompleteCode(code: string): boolean {
  return code.length === LENGTH
}

export const CODE_LENGTH = LENGTH
