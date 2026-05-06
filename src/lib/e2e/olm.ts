'use client'
import Olm from '@matrix-org/olm'
import { putEncrypted, getEncrypted } from './storage'
import { bytesToBase64, utf8ToBytes, bytesToUtf8, base64ToBytes } from './encoding'

let olmReady: Promise<void> | null = null
export function ensureOlm(): Promise<void> {
  if (!olmReady) {
    olmReady = Olm.init({ locateFile: () => '/olm.wasm' })
  }
  return olmReady
}

const ACCOUNT_KEY = 'account'
// Sessions are keyed by (dmKey, remote device id) — multi-device fanout means
// one session per remote device per chat. The `did` is the peer's Olm
// curve25519 identity key (stable per Olm Account).
const sessionKey = (dmKey: string, did: string) => `session/${dmKey}/${did}`
// Per-chat list of known peer + own-other devices (each carries the bundle we
// observed in their handshake message).
const rosterKey = (dmKey: string) => `roster/${dmKey}`

const pickleKey = (storageKey: Uint8Array) => bytesToBase64(storageKey)

export async function loadOrCreateAccount(storageKey: Uint8Array): Promise<Olm.Account> {
  await ensureOlm()
  const account = new Olm.Account()
  const pickled = await getEncrypted(ACCOUNT_KEY, storageKey)
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
  await persistAccount(account, storageKey)
  return account
}

export async function persistAccount(account: Olm.Account, storageKey: Uint8Array) {
  const pickled = account.pickle(pickleKey(storageKey))
  await putEncrypted(ACCOUNT_KEY, utf8ToBytes(pickled), storageKey)
}

export async function loadSession(dmKey: string, did: string, storageKey: Uint8Array): Promise<Olm.Session | null> {
  await ensureOlm()
  const pickled = await getEncrypted(sessionKey(dmKey, did), storageKey)
  if (!pickled) return null
  const session = new Olm.Session()
  session.unpickle(pickleKey(storageKey), bytesToUtf8(pickled))
  return session
}

export async function persistSession(
  dmKey: string,
  did: string,
  session: Olm.Session,
  storageKey: Uint8Array,
) {
  const pickled = session.pickle(pickleKey(storageKey))
  await putEncrypted(sessionKey(dmKey, did), utf8ToBytes(pickled), storageKey)
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

export async function loadRoster(dmKey: string, storageKey: Uint8Array): Promise<RosterEntry[]> {
  const blob = await getEncrypted(rosterKey(dmKey), storageKey)
  if (!blob) return []
  return JSON.parse(bytesToUtf8(blob)) as RosterEntry[]
}

export async function saveRoster(dmKey: string, roster: RosterEntry[], storageKey: Uint8Array) {
  await putEncrypted(rosterKey(dmKey), utf8ToBytes(JSON.stringify(roster)), storageKey)
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
