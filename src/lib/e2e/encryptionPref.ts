'use client'

// Per-chat user preference for whether to actually encrypt sends when the
// session is otherwise ready. A user who has bootstrapped E2E for a chat
// may still want to fall back to plaintext for individual messages (e.g.
// to share a link they want a server-side bot to see). The preference is
// per-chat and persisted in localStorage so it survives reload.
//
// Singleton + module-level pub/sub so a setter call in the header
// immediately reflects in the composer's disable gate, in useSendMessage's
// mutationFn (which reads via getEncryptionDisabled), and in any visible
// indicator — without prop-drilling or a context provider.

const KEY = (chatId: string) => `grails-e2e-off:${chatId}`

type Listener = () => void
const listeners = new Set<Listener>()

export function getEncryptionDisabled(chatId: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(KEY(chatId)) === '1'
  } catch {
    return false
  }
}

export function setEncryptionDisabled(chatId: string, off: boolean): void {
  if (typeof window === 'undefined') return
  try {
    if (off) window.localStorage.setItem(KEY(chatId), '1')
    else window.localStorage.removeItem(KEY(chatId))
  } catch {
    // localStorage can throw in private mode / quota — keep the in-memory
    // notify path so the UI still reflects the user's choice for this tab.
  }
  listeners.forEach((l) => l())
}

export function subscribeEncryptionPref(l: Listener): () => void {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}
