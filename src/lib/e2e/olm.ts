'use client'
// Type-only import: turbopack/webpack will not pull olm.js into the bundle
// (its UMD wrapper contains static `require('fs')` calls in dead Node-only
// branches that cannot be statically resolved for the browser). The runtime
// is loaded via a script tag from /public/olm.js the first time we need it,
// and exposes `window.Olm`.
import type Olm from '@matrix-org/olm'
import { putEncrypted, getEncrypted, listKeys } from './storage'
import { bytesToBase64, utf8ToBytes, bytesToUtf8, base64ToBytes } from './encoding'
import { deriveSubkey } from './identity'

declare global {
  interface Window {
    Olm?: typeof Olm
  }
}

let olmReady: Promise<void> | null = null

function loadOlmScript(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('Olm requires a browser environment'))
      return
    }
    const existing = document.querySelector<HTMLScriptElement>('script[data-olm]')
    if (existing) {
      if (window.Olm) return resolve()
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('olm.js load failed')), { once: true })
      return
    }
    const script = document.createElement('script')
    script.src = '/olm.js'
    script.async = true
    script.dataset.olm = '1'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('olm.js load failed'))
    document.head.appendChild(script)
  })
}

export function ensureOlm(): Promise<void> {
  if (olmReady) return olmReady
  olmReady = (async () => {
    if (typeof window === 'undefined') throw new Error('Olm requires a browser environment')
    if (!window.Olm) await loadOlmScript()
    if (!window.Olm) throw new Error('Olm global not available after script load')
    await window.Olm.init({ locateFile: () => '/olm.wasm' })
  })()
  return olmReady
}

function olmRuntime(): typeof Olm {
  if (typeof window === 'undefined' || !window.Olm) {
    throw new Error('Olm runtime not initialized — call ensureOlm() first')
  }
  return window.Olm
}

// Up to TWO Olm sessions per (this_device, peer_device): the outbound we
// initiated (encrypts our messages on our channel) and the inbound peer
// initiated (decrypts their messages on their channel). Keeping both is
// required to survive the race where both sides eagerly send a pre-key —
// discarding either loses the channel that's still active for future
// messages from one direction.
export type SessionDirection = 'out' | 'in'

// All storage keys are namespaced by the authed wallet address so two
// different wallets in the same browser maintain their own Olm account,
// sessions, rosters, and flags without secretbox-decrypt collisions. Without
// this prefix, wallet B's `getEncrypted` against wallet A's blob (encrypted
// with a different storage key) throws "wrong wallet?" and the only recovery
// is manually clearing IndexedDB.
//
// Centralized so callers can't drift away from the `wallet/{address}/...`
// shape and so a refactor of the key space lives in one place.
export const storageKeys = {
  account: (address: string) => `wallet/${address}/account`,
  session: (address: string, dmKey: string, did: string, direction: SessionDirection) =>
    `wallet/${address}/session/${dmKey}/${did}/${direction}`,
  // Prefix used by listKeys() in loadAllSessionsForChat — must match the
  // shape session() produces, minus the (did, direction) suffix.
  sessionPrefix: (address: string, dmKey: string) =>
    `wallet/${address}/session/${dmKey}/`,
  // Per-chat list of known peer + own-other devices (each carries the bundle
  // we observed in their handshake message).
  roster: (address: string, dmKey: string) => `wallet/${address}/roster/${dmKey}`,
  // Per-message plaintext store for messages WE sent. Self-fanouts have no
  // `cts` entry for our own device (we exclude ourselves), so on refresh
  // `session.decrypt` would throw and we'd lose our own history.
  ownPlaintext: (address: string, messageId: string) =>
    `wallet/${address}/own-plaintext/${messageId}`,
  // Per-chat boolean: have we already broadcast our handshake bundle into
  // this chat at least once? Survives refresh and is independent of message
  // history pagination depth — defeats the failure mode where our own
  // handshake row is older than useChatMessages's first page (50 entries)
  // and the banner's `sawOwnHandshake` heuristic mis-fires.
  ownHandshakePublished: (address: string, dmKey: string) =>
    `wallet/${address}/published/${dmKey}`,
} as const

// HKDF subkey for Olm pickle, distinct from the secretbox-at-rest key used
// in storage.ts. Olm requires a string/Uint8Array input; we hand it the
// base64 of the derived 32 bytes for stable formatting across pickle/unpickle.
const pickleKey = (storageKey: Uint8Array) => bytesToBase64(deriveSubkey(storageKey, 'pickle'))

export async function loadOrCreateAccount(address: string, storageKey: Uint8Array): Promise<Olm.Account> {
  await ensureOlm()
  const Olm = olmRuntime()
  const account = new Olm.Account()
  const pickled = await getEncrypted(storageKeys.account(address), storageKey)
  if (pickled) {
    account.unpickle(pickleKey(storageKey), bytesToUtf8(pickled))
    return account
  }
  account.create()
  // OTKs are still generated to support inbound pre-key messages from peers
  // running an older bundle format (which referenced single-use OTKs). New
  // bundles we publish use the fallback key (see exportBundle below) so the
  // same handshake message can bootstrap multiple peer devices without OTK
  // exhaustion (Olm consumes OTKs after first use; fallback survives).
  account.generate_one_time_keys(50)
  account.generate_fallback_key()
  await persistAccount(address, account, storageKey)
  return account
}

export async function persistAccount(address: string, account: Olm.Account, storageKey: Uint8Array) {
  const pickled = account.pickle(pickleKey(storageKey))
  await putEncrypted(storageKeys.account(address), utf8ToBytes(pickled), storageKey)
}

export async function loadSession(
  address: string,
  dmKey: string,
  did: string,
  direction: SessionDirection,
  storageKey: Uint8Array,
): Promise<Olm.Session | null> {
  await ensureOlm()
  const pickled = await getEncrypted(storageKeys.session(address, dmKey, did, direction), storageKey)
  if (!pickled) return null
  const Olm = olmRuntime()
  const session = new Olm.Session()
  session.unpickle(pickleKey(storageKey), bytesToUtf8(pickled))
  return session
}

export async function persistSession(
  address: string,
  dmKey: string,
  did: string,
  direction: SessionDirection,
  session: Olm.Session,
  storageKey: Uint8Array,
) {
  const pickled = session.pickle(pickleKey(storageKey))
  await putEncrypted(storageKeys.session(address, dmKey, did, direction), utf8ToBytes(pickled), storageKey)
}

// Discover and unpickle every persisted session for a (wallet, chat) pair —
// independent of what the roster claims. Source-of-truth for "what sessions
// exist on disk" is the IndexedDB key space, not the roster: `decryptCt`
// can persist an inbound session without ever upserting the roster (peer's
// pre-key arrives before we observe their handshake), and a refresh would
// otherwise leave that session unloaded and the message undecryptable.
export async function loadAllSessionsForChat(
  address: string,
  dmKey: string,
  storageKey: Uint8Array,
): Promise<Array<{ did: string; direction: SessionDirection; session: Olm.Session }>> {
  await ensureOlm()
  const Olm = olmRuntime()
  const prefix = storageKeys.sessionPrefix(address, dmKey)
  const keys = await listKeys(prefix)
  const out: Array<{ did: string; direction: SessionDirection; session: Olm.Session }> = []
  for (const key of keys) {
    const tail = key.slice(prefix.length)
    const lastSlash = tail.lastIndexOf('/')
    if (lastSlash === -1) continue
    const did = tail.slice(0, lastSlash)
    const dir = tail.slice(lastSlash + 1)
    if (dir !== 'out' && dir !== 'in') continue
    const blob = await getEncrypted(key, storageKey)
    if (!blob) continue
    const session = new Olm.Session()
    session.unpickle(pickleKey(storageKey), bytesToUtf8(blob))
    out.push({ did, direction: dir, session })
  }
  return out
}

// Roster: per-chat list of {did, user_id, identity, signing} entries we've
// observed via handshake messages. The `otk`/`otkId` we received are NOT
// stored — Olm consumes them at create_outbound time, and a stale OTK is
// useless. Outbound sessions are persisted independently per (dmKey, did).
export type RosterEntry = {
  did: string
  user_id: number
  identity: string
  signing: string
}

export async function loadRoster(
  address: string,
  dmKey: string,
  storageKey: Uint8Array,
): Promise<RosterEntry[]> {
  const blob = await getEncrypted(storageKeys.roster(address, dmKey), storageKey)
  if (!blob) return []
  return JSON.parse(bytesToUtf8(blob)) as RosterEntry[]
}

export async function saveRoster(
  address: string,
  dmKey: string,
  roster: RosterEntry[],
  storageKey: Uint8Array,
) {
  await putEncrypted(storageKeys.roster(address, dmKey), utf8ToBytes(JSON.stringify(roster)), storageKey)
}

export async function persistOwnPlaintext(
  address: string,
  messageId: string,
  plaintext: string,
  storageKey: Uint8Array,
) {
  await putEncrypted(storageKeys.ownPlaintext(address, messageId), utf8ToBytes(plaintext), storageKey)
}

export async function loadOwnPlaintext(
  address: string,
  messageId: string,
  storageKey: Uint8Array,
): Promise<string | null> {
  const blob = await getEncrypted(storageKeys.ownPlaintext(address, messageId), storageKey)
  return blob ? bytesToUtf8(blob) : null
}

// Per-chat boolean flag — set after the first time we broadcast our handshake
// bundle into a chat. Read on banner mount to suppress the auto-publish
// fallback when our handshake row would otherwise be invisible (paginated
// past the first 50 messages). The flag is encrypted at rest with the same
// secretbox-subkey as everything else so the cross-wallet isolation contract
// is unchanged. Stored as a single byte (`Uint8Array([1])`) — its presence
// is the signal, the value is incidental.
export async function loadHandshakePublished(
  address: string,
  dmKey: string,
  storageKey: Uint8Array,
): Promise<boolean> {
  const blob = await getEncrypted(storageKeys.ownHandshakePublished(address, dmKey), storageKey)
  return blob !== null
}

export async function markHandshakePublished(
  address: string,
  dmKey: string,
  storageKey: Uint8Array,
) {
  await putEncrypted(
    storageKeys.ownHandshakePublished(address, dmKey),
    new Uint8Array([1]),
    storageKey,
  )
}

// PeerBundle preferred shape: identity + signing + fallback_key. Older bundles
// also accept otkId/otk fields (parseBundle keeps both forms; createOutbound
// prefers fallback_key). Bundle authentication is NOT cryptographically
// guaranteed: an active backend could substitute a forged bundle on first
// contact. We accept this in the documented passive-attacker threat model
// (see plan: "Risks and follow-ups → Active-MITM detection").
export type PeerBundle = {
  identity: string
  signing: string
  fallback_key?: string
  otkId?: string
  otk?: string
}

function readFallbackPublicKey(account: Olm.Account): string {
  const fb = JSON.parse(account.fallback_key()) as { curve25519?: Record<string, string> }
  const entries = fb.curve25519 ? Object.entries(fb.curve25519) : []
  if (entries.length === 0) {
    account.generate_fallback_key()
    const next = JSON.parse(account.fallback_key()) as { curve25519?: Record<string, string> }
    const nextEntries = next.curve25519 ? Object.entries(next.curve25519) : []
    if (nextEntries.length === 0) throw new Error('Failed to obtain fallback key')
    return nextEntries[0]![1]!
  }
  return entries[0]![1]!
}

export function exportBundle(account: Olm.Account): string {
  const identity = JSON.parse(account.identity_keys()) as { curve25519: string; ed25519: string }
  const fallback_key = readFallbackPublicKey(account)
  // mark_keys_as_published() flips the fallback (and any leftover OTKs) into
  // the "published" pool so the bundle we hand out can be referenced by
  // incoming pre-key messages.
  account.mark_keys_as_published()
  const bundle: PeerBundle = {
    identity: identity.curve25519,
    signing: identity.ed25519,
    fallback_key,
  }
  return bytesToBase64(utf8ToBytes(JSON.stringify(bundle)))
}

export function parseBundle(encoded: string): PeerBundle {
  return JSON.parse(bytesToUtf8(base64ToBytes(encoded))) as PeerBundle
}
