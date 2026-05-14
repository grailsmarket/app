import { afterEach, describe, expect, it } from 'bun:test'
import type { Hex } from 'viem'
import { deriveStorageKey } from '../identity'
import { deleteEntry, getEncrypted, listKeys, putEncrypted } from '../storage'

const KEY_A = deriveStorageKey(`0x${'aa'.repeat(65)}` as Hex)
const KEY_B = deriveStorageKey(`0x${'bb'.repeat(65)}` as Hex)

const utf8 = new TextEncoder()
const enc = (s: string) => utf8.encode(s)

// fake-indexeddb persists across tests within a process. We clean up the
// keys we touch so each test sees a deterministic starting state.
const cleanupKeys: string[] = []
afterEach(async () => {
  while (cleanupKeys.length > 0) {
    const key = cleanupKeys.pop()!
    await deleteEntry(key)
  }
})

describe('storage round-trip', () => {
  it('putEncrypted then getEncrypted returns the original plaintext', async () => {
    const key = 'test/round-trip-1'
    cleanupKeys.push(key)
    await putEncrypted(key, enc('hello world'), KEY_A)
    const out = await getEncrypted(key, KEY_A)
    expect(out).not.toBeNull()
    expect(new TextDecoder().decode(out!)).toBe('hello world')
  })

  it('getEncrypted returns null for a missing key', async () => {
    // This is the signal loadOrCreateAccount uses to decide "first time vs
    // restore" — pinning it down so a refactor that throws on missing keys
    // would be caught.
    const out = await getEncrypted('test/never-written', KEY_A)
    expect(out).toBeNull()
  })

  it('overwrites in place when the same key is written twice', async () => {
    const key = 'test/overwrite'
    cleanupKeys.push(key)
    await putEncrypted(key, enc('v1'), KEY_A)
    await putEncrypted(key, enc('v2'), KEY_A)
    const out = await getEncrypted(key, KEY_A)
    expect(new TextDecoder().decode(out!)).toBe('v2')
  })

  it('decryption with the wrong storage key throws "wrong wallet?"', async () => {
    // Pins the cross-wallet isolation contract — wallet B should never be
    // able to read wallet A's blobs even if they share the underlying
    // IndexedDB.
    const key = 'test/cross-wallet'
    cleanupKeys.push(key)
    await putEncrypted(key, enc('secret'), KEY_A)
    await expect(getEncrypted(key, KEY_B)).rejects.toThrow(/wrong wallet/i)
  })
})

describe('listKeys prefix scan', () => {
  it('returns only keys with the given prefix', async () => {
    const k1 = 'wallet/0xaaa/session/dm-1/peer-x/out'
    const k2 = 'wallet/0xaaa/session/dm-1/peer-x/in'
    const k3 = 'wallet/0xaaa/session/dm-1/peer-y/out'
    const k4 = 'wallet/0xaaa/session/dm-2/peer-x/out' // different dmKey — excluded
    const k5 = 'wallet/0xbbb/session/dm-1/peer-x/out' // different wallet — excluded
    cleanupKeys.push(k1, k2, k3, k4, k5)
    for (const k of [k1, k2, k3, k4, k5]) {
      await putEncrypted(k, enc(k), KEY_A)
    }
    const prefix = 'wallet/0xaaa/session/dm-1/'
    const found = await listKeys(prefix)
    expect(found.sort()).toEqual([k1, k2, k3].sort())
  })

  it('returns [] when no key matches the prefix', async () => {
    const found = await listKeys('wallet/0xnone/')
    expect(found).toEqual([])
  })
})
