'use client'

// `useE2ESession` is owned by the E2EHandshakeBanner (one mount per chat).
// All other consumers (useSendMessage, useDecryptedBody, the WS handler) reach
// the live session through this module-level registry — instantiating the hook
// twice for the same chatId would create two Olm Accounts in memory and only
// the unlocking instance would have keys loaded.

export interface SessionAPI {
  isReady(): boolean
  encrypt: (plaintext: string, mid?: string) => string
  decrypt: (ciphertext: string, type: 0 | 1) => Promise<string>
}

class SessionRegistry {
  private map = new Map<string, SessionAPI>()
  register(chatId: string, api: SessionAPI) {
    this.map.set(chatId, api)
  }
  unregister(chatId: string) {
    this.map.delete(chatId)
  }
  get(chatId: string): SessionAPI | undefined {
    return this.map.get(chatId)
  }
}

export const sessionRegistry = new SessionRegistry()
