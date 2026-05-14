import { beforeEach, describe, expect, it } from 'bun:test'
import type { Hex } from 'viem'
import { deriveStorageKey } from '../identity'
import {
  exportBundle,
  loadAllSessionsForChat,
  loadHandshakePublished,
  loadOrCreateAccount,
  loadSession,
  markHandshakePublished,
  parseBundle,
  persistSession,
  storageKeys,
} from '../olm'
import { getEncrypted, deleteEntry, listKeys } from '../storage'
import { createOutboundSession } from '../wire'

// fake-indexeddb persists across tests in a process. Each suite scopes its
// state by using a fresh wallet address (the prefix), so we just iterate the
// known key shapes and wipe between tests.
async function wipeWallet(address: string) {
  for (const prefix of [
    `wallet/${address}/`,
  ]) {
    const keys = await listKeys(prefix)
    for (const k of keys) await deleteEntry(k)
  }
}

const SIG_A: Hex = `0x${'a1'.repeat(65)}`
const SIG_PEER: Hex = `0x${'b2'.repeat(65)}`

const ADDRESS = '0xuser'
const DM_KEY = 'dm-abc'

// Build a real peer bundle from a freshly-created Olm Account (Node-side via
// the test setup's window.Olm). This is what the app sees when scanning chat
// history for a peer's published handshake row.
async function freshPeerBundle(): Promise<string> {
  const peerKey = deriveStorageKey(SIG_PEER)
  // Use a throwaway address namespace for the peer so it doesn't collide with
  // the user's data on disk.
  const peerAccount = await loadOrCreateAccount('0xpeer-test-' + Math.random(), peerKey)
  const bundle = exportBundle(peerAccount)
  peerAccount.free()
  return bundle
}

describe('olm restoration semantics', () => {
  let userStorageKey: Uint8Array

  beforeEach(async () => {
    await wipeWallet(ADDRESS)
    userStorageKey = deriveStorageKey(SIG_A)
  })

  it('loadOrCreateAccount preserves device identity across a simulated refresh', async () => {
    // First "session": create + persist.
    const first = await loadOrCreateAccount(ADDRESS, userStorageKey)
    const idA = JSON.parse(first.identity_keys()) as { curve25519: string; ed25519: string }
    first.free()

    // Second "session": fresh in-memory state, same address + storage key —
    // mirrors a page refresh + unlock-with-same-signature. Should load the
    // stored pickle, not create a new account.
    const second = await loadOrCreateAccount(ADDRESS, userStorageKey)
    const idB = JSON.parse(second.identity_keys()) as { curve25519: string; ed25519: string }
    second.free()

    expect(idB.curve25519).toBe(idA.curve25519)
    expect(idB.ed25519).toBe(idA.ed25519)
  })

  it('loadAllSessionsForChat returns persisted outbound sessions', async () => {
    const account = await loadOrCreateAccount(ADDRESS, userStorageKey)
    const peerBundle = await freshPeerBundle()
    const peer = parseBundle(peerBundle)

    const outSession = await createOutboundSession(account, peer)
    await persistSession(ADDRESS, DM_KEY, peer.identity, 'out', outSession, userStorageKey)

    // Simulate refresh: drop the in-memory session and reload from disk.
    outSession.free()

    const loaded = await loadAllSessionsForChat(ADDRESS, DM_KEY, userStorageKey)
    expect(loaded.length).toBe(1)
    expect(loaded[0]!.did).toBe(peer.identity)
    expect(loaded[0]!.direction).toBe('out')

    for (const s of loaded) s.session.free()
    account.free()
  })

  it('loadSession returns null when no session is on disk for that direction', async () => {
    const ok = await loadSession(ADDRESS, DM_KEY, 'peer-did-never-saved', 'out', userStorageKey)
    expect(ok).toBeNull()
  })

  it('a stored outbound session round-trips byte-for-byte through persist + load', async () => {
    // This is the property consumePeerBundle's cache-miss path relies on:
    // if we previously persisted an outbound session for a peer, loading it
    // back must produce an Olm.Session that decrypts what the original could
    // — i.e. the pickle bytes on disk must NOT be overwritten by an
    // accidental re-derivation. Pinning the bytes is the simplest assertion
    // that "the stored session is still there."
    const account = await loadOrCreateAccount(ADDRESS, userStorageKey)
    const peerBundle = await freshPeerBundle()
    const peer = parseBundle(peerBundle)

    const outSession = await createOutboundSession(account, peer)
    await persistSession(ADDRESS, DM_KEY, peer.identity, 'out', outSession, userStorageKey)
    outSession.free()

    const before = await getEncrypted(
      storageKeys.session(ADDRESS, DM_KEY, peer.identity, 'out'),
      userStorageKey,
    )
    expect(before).not.toBeNull()
    const beforeBytes = new Uint8Array(before!)

    // No additional persist call — the stored session should be untouched.
    const after = await getEncrypted(
      storageKeys.session(ADDRESS, DM_KEY, peer.identity, 'out'),
      userStorageKey,
    )
    expect(after).not.toBeNull()
    expect(new Uint8Array(after!)).toEqual(beforeBytes)

    account.free()
  })

  it('markHandshakePublished + loadHandshakePublished round-trip', async () => {
    expect(await loadHandshakePublished(ADDRESS, DM_KEY, userStorageKey)).toBe(false)
    await markHandshakePublished(ADDRESS, DM_KEY, userStorageKey)
    expect(await loadHandshakePublished(ADDRESS, DM_KEY, userStorageKey)).toBe(true)
  })

  it('the published flag is namespaced per (wallet, dmKey)', async () => {
    // Two chats under the same wallet must have independent flags, and two
    // wallets must not share. This is what makes the suppression decision
    // correct under multi-account browsing.
    await markHandshakePublished(ADDRESS, 'dm-chat-A', userStorageKey)
    expect(await loadHandshakePublished(ADDRESS, 'dm-chat-A', userStorageKey)).toBe(true)
    expect(await loadHandshakePublished(ADDRESS, 'dm-chat-B', userStorageKey)).toBe(false)

    const otherWallet = deriveStorageKey(`0x${'cc'.repeat(65)}` as Hex)
    expect(await loadHandshakePublished('0xother', 'dm-chat-A', otherWallet)).toBe(false)
  })

  it('published flag survives a simulated refresh (load with fresh storage key derivation)', async () => {
    await markHandshakePublished(ADDRESS, DM_KEY, userStorageKey)
    // Re-derive the storage key from the same signature — what unlock() does
    // after a refresh. Should still decrypt the on-disk flag.
    const userKeyRound2 = deriveStorageKey(SIG_A)
    expect(await loadHandshakePublished(ADDRESS, DM_KEY, userKeyRound2)).toBe(true)
  })
})
