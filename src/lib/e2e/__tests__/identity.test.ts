import { describe, expect, it } from 'bun:test'
import type { Hex } from 'viem'
import { deriveStorageKey, deriveSubkey } from '../identity'

const SIG: Hex = `0x${'ab'.repeat(65)}` // any 65-byte hex string is fine for this test

describe('identity', () => {
  it('deriveStorageKey is deterministic for the same signature', () => {
    const a = deriveStorageKey(SIG)
    const b = deriveStorageKey(SIG)
    expect(a).toEqual(b)
    expect(a.length).toBe(32)
  })

  it('deriveStorageKey diverges for different signatures', () => {
    const a = deriveStorageKey(SIG)
    const b = deriveStorageKey(`0x${'cd'.repeat(65)}` as Hex)
    expect(a).not.toEqual(b)
  })

  it('deriveSubkey produces distinct keys for different info strings', () => {
    const master = deriveStorageKey(SIG)
    const secretboxKey = deriveSubkey(master, 'secretbox')
    const pickleKey = deriveSubkey(master, 'pickle')
    expect(secretboxKey).not.toEqual(pickleKey)
    // Same info string is deterministic.
    expect(deriveSubkey(master, 'secretbox')).toEqual(secretboxKey)
    expect(secretboxKey.length).toBe(32)
  })
})
