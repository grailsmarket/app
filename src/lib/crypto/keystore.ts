/**
 * IndexedDB-backed cache of derived messaging keypairs, scoped per wallet
 * address. Falls back to in-memory when IndexedDB is unavailable (SSR, private
 * browsing edge cases) so callers don't need to handle the missing-db case.
 */

const DB_NAME = 'grails-messaging'
const DB_VERSION = 1
const STORE = 'keypairs'

export interface StoredKeypair {
  address: string
  publicKey: Uint8Array
  secretKey: Uint8Array
  /** base64 of `publicKey` — sent to backend, kept here for re-publish without re-signing. */
  publicKeyBase64: string
  /** Wallet signature over the binding message; proves `publicKey` belongs to `address`. */
  bindingSignature: `0x${string}`
  version: 1
  createdAt: string
}

const memoryStore = new Map<string, StoredKeypair>()

const openDb = (): Promise<IDBDatabase | null> =>
  new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') return resolve(null)
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'address' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => resolve(null)
  })

const normalize = (address: string) => address.toLowerCase()

export const loadKeypair = async (address: string): Promise<StoredKeypair | null> => {
  const key = normalize(address)
  const cached = memoryStore.get(key)
  if (cached) return cached

  const db = await openDb()
  if (!db) return null

  return new Promise((resolve) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).get(key)
    req.onsuccess = () => {
      const value = req.result as StoredKeypair | undefined
      if (value) memoryStore.set(key, value)
      resolve(value ?? null)
    }
    req.onerror = () => resolve(null)
  })
}

export const saveKeypair = async (keypair: StoredKeypair): Promise<void> => {
  const key = normalize(keypair.address)
  const value: StoredKeypair = { ...keypair, address: key }
  memoryStore.set(key, value)

  const db = await openDb()
  if (!db) return

  await new Promise<void>((resolve) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(value)
    tx.oncomplete = () => resolve()
    tx.onerror = () => resolve()
  })
}

export const clearKeypair = async (address: string): Promise<void> => {
  const key = normalize(address)
  memoryStore.delete(key)

  const db = await openDb()
  if (!db) return

  await new Promise<void>((resolve) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => resolve()
  })
}
