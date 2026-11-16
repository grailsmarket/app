import type { Hex } from 'viem'

export interface AnniversaryPendingTransaction {
  hash: Hex
  isSafe: boolean
}

export interface AnniversaryClaimSnapshot {
  step: 'review' | 'preparing' | 'wallet' | 'pending' | 'success' | 'error'
  hash: Hex | null
  pending: AnniversaryPendingTransaction | null
  error: string | null
  statusError: string | null
  savingStatus: boolean
  dismissing: boolean
}

type PendingStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

const initialSnapshot: AnniversaryClaimSnapshot = {
  step: 'review',
  hash: null,
  pending: null,
  error: null,
  statusError: null,
  savingStatus: false,
  dismissing: false,
}

export const UNCONFIRMED_ANNIVERSARY_CLAIM =
  'Your transaction was submitted, but confirmation is unavailable. Check it again to continue.'

const readPending = (storage: PendingStorage | undefined, key: string): AnniversaryPendingTransaction | null => {
  try {
    const value: unknown = JSON.parse(storage?.getItem(key) ?? 'null')
    if (
      value &&
      typeof value === 'object' &&
      'hash' in value &&
      typeof value.hash === 'string' &&
      /^0x[\da-fA-F]{64}$/.test(value.hash) &&
      'isSafe' in value &&
      typeof value.isSafe === 'boolean'
    )
      return { hash: value.hash as Hex, isSafe: value.isSafe }
  } catch {
    // Storage can be unavailable or contain an interrupted write. Memory remains usable.
  }
  return null
}

const createSession = (key: string, storage: PendingStorage | undefined) => {
  const storageKey = `grails:anniversary:pending:${key}`
  const pending = readPending(storage, storageKey)
  let snapshot: AnniversaryClaimSnapshot = pending
    ? { ...initialSnapshot, step: 'error', hash: pending.hash, pending, error: UNCONFIRMED_ANNIVERSARY_CLAIM }
    : initialSnapshot
  const listeners = new Set<() => void>()
  let operation: Promise<void> | null = null

  return {
    getSnapshot: () => snapshot,
    getServerSnapshot: () => initialSnapshot,
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    update: (patch: Partial<AnniversaryClaimSnapshot>) => {
      snapshot = { ...snapshot, ...patch }
      if ('pending' in patch) {
        try {
          // Only the transaction hash and Safe flag survive a reload; never proofs or credentials.
          if (snapshot.pending) storage?.setItem(storageKey, JSON.stringify(snapshot.pending))
          else storage?.removeItem(storageKey)
        } catch {
          // The shared in-memory session still prevents duplicate submissions when storage is blocked.
        }
      }
      listeners.forEach((listener) => listener())
    },
    isRunning: () => operation !== null,
    run: (work: () => Promise<void>) => {
      if (operation) return operation
      operation = Promise.resolve()
        .then(work)
        .finally(() => {
          operation = null
        })
      return operation
    },
  }
}

export const createAnniversaryClaimSessions = (getStorage: () => PendingStorage | undefined) => {
  const sessions = new Map<string, ReturnType<typeof createSession>>()
  return {
    get: (key: string) => {
      const existing = sessions.get(key)
      if (existing) return existing
      let storage: PendingStorage | undefined
      try {
        storage = getStorage()
      } catch {
        // Browser privacy settings can throw when accessing sessionStorage itself.
      }
      const session = createSession(key, storage)
      sessions.set(key, session)
      return session
    },
  }
}

export const anniversaryClaimSessions = createAnniversaryClaimSessions(() =>
  typeof window === 'undefined' ? undefined : window.sessionStorage
)
