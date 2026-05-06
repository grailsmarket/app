'use client'

import type { E2EMsgEnvelope, E2EFanoutEnvelope } from './wire'

// `useE2ESession` is owned by the E2EHandshakeBanner (one mount per chat).
// All other consumers (useSendMessage, useDecryptedBody, the WS handler) reach
// the live session through this module-level registry — instantiating the hook
// twice for the same chatId would create two Olm Accounts in memory and only
// the unlocking instance would have keys loaded.

export interface SessionAPI {
  isReady(): boolean
  // Returns the encoded body (msg or fanout envelope JSON) ready for POST.
  encrypt: (plaintext: string, mid?: string) => string
  // Decrypt accepts the parsed envelope so it can route by sender_did
  // (fanout) or fall back to the only-known-session heuristic (legacy msg).
  decrypt: (env: E2EMsgEnvelope | E2EFanoutEnvelope) => Promise<string>
}

class SessionRegistry {
  private map = new Map<string, SessionAPI>()
  private listeners = new Set<() => void>()
  register(chatId: string, api: SessionAPI) {
    this.map.set(chatId, api)
    this.notify()
  }
  unregister(chatId: string) {
    this.map.delete(chatId)
    this.notify()
  }
  get(chatId: string): SessionAPI | undefined {
    return this.map.get(chatId)
  }
  // Re-render trigger for `useDecryptedBody`: when the banner unlocks and
  // registers a session, locked rows mounted before unlock must retry.
  subscribe(l: () => void): () => void {
    this.listeners.add(l)
    return () => {
      this.listeners.delete(l)
    }
  }
  private notify() {
    this.listeners.forEach((l) => l())
  }
}

export const sessionRegistry = new SessionRegistry()
