import type { StoredKeypair } from '@/lib/crypto'

/**
 * Module-level holder for the current user's messaging keypair.
 *
 * useMessagingKeys (mounted once at the providers level) owns the lifecycle
 * and writes here. Non-React code (WebSocket handlers, fetch transforms) and
 * other components read via getCurrentMessagingKeypair / subscribe.
 *
 * The keypair is in-memory only — IndexedDB is the persistent layer.
 */

let current: StoredKeypair | null = null
const listeners = new Set<() => void>()

export const setCurrentMessagingKeypair = (kp: StoredKeypair | null) => {
  current = kp
  for (const listener of listeners) listener()
}

export const getCurrentMessagingKeypair = (): StoredKeypair | null => current

export const subscribeMessagingKeypair = (listener: () => void): (() => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
