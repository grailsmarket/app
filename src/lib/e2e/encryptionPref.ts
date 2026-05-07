'use client'

// Per-chat user preference for whether to actually encrypt sends when the
// session is otherwise ready. A user who has bootstrapped E2E for a chat
// may still want to fall back to plaintext for individual messages (e.g.
// to share a link they want a server-side bot to see). The preference is
// per-chat, persisted in localStorage on a best-effort basis so it survives
// reload, but the in-memory map is the canonical source for the running tab
// — localStorage failures in private mode / quota-exhausted environments
// must not silently invalidate the user's toggle.
//
// Singleton + module-level pub/sub so a setter call in the header
// immediately reflects in the composer's disable gate, in useSendMessage's
// mutationFn (which reads via getEncryptionDisabled), and in any visible
// indicator — without prop-drilling or a context provider.

const KEY = (chatId: string) => `grails-e2e-off:${chatId}`

type Listener = () => void
const listeners = new Set<Listener>()
// Canonical state for the running tab. Hydrated lazily from localStorage on
// first read of an unknown chatId; written through on every setter call.
const memory = new Map<string, boolean>()

function readStorage(chatId: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(KEY(chatId)) === '1'
  } catch {
    return false
  }
}

export function getEncryptionDisabled(chatId: string): boolean {
  const cached = memory.get(chatId)
  if (cached !== undefined) return cached
  const fromStorage = readStorage(chatId)
  memory.set(chatId, fromStorage)
  return fromStorage
}

export function setEncryptionDisabled(chatId: string, off: boolean): void {
  // Memory first — this is what the rest of the app reads back. Even if
  // localStorage throws (private mode / quota), the user's toggle takes
  // effect for the rest of this tab's lifetime.
  memory.set(chatId, off)
  if (typeof window !== 'undefined') {
    try {
      if (off) window.localStorage.setItem(KEY(chatId), '1')
      else window.localStorage.removeItem(KEY(chatId))
    } catch {
      // Best-effort persist; memory is canonical for this tab.
    }
  }
  listeners.forEach((l) => l())
}

export function subscribeEncryptionPref(l: Listener): () => void {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}
