'use client'

import type { E2EFanoutEnvelope } from './wire'

// `useE2ESession` is owned by the E2EHandshakeBanner (one mount per chat).
// All other consumers (useSendMessage, useDecryptedBody, the WS handler) reach
// the live session through this module-level registry — instantiating the hook
// twice for the same chatId would create two Olm Accounts in memory and only
// the unlocking instance would have keys loaded.

export interface SessionAPI {
  isReady(): boolean
  // This device's Olm identity (curve25519 public key). Used by the WS
  // handler to detect own-device echoes of fanout envelopes (sender_did
  // matches) and skip decryption for those — the plaintext is already in
  // the cache from useSendMessage's mutationFn.
  ownDid(): string | null
  // Returns the encoded fanout envelope JSON ready for POST. Async so the
  // ratchet-state persist completes before the caller treats the message as
  // sent — a tab close mid-flight would otherwise roll back to a stale
  // ratchet on the next load.
  encrypt: (plaintext: string, mid?: string) => Promise<string>
  // Decrypt accepts the parsed fanout envelope; resolves with the plaintext
  // for this device's `cts` entry.
  decrypt: (env: E2EFanoutEnvelope) => Promise<string>
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

  // Drop all registered sessions. Used on auth change so a different user
  // signing in on the same device doesn't inherit access to encrypt/decrypt
  // through stale APIs left behind by the previous user's banner mount.
  clearAll() {
    if (this.map.size === 0) return
    this.map.clear()
    this.notify()
  }
}

export const sessionRegistry = new SessionRegistry()
