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
const sessionKey = (dmKey: string) => `session/${dmKey}`

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
  account.generate_one_time_keys(50)
  await persistAccount(account, storageKey)
  return account
}

export async function persistAccount(account: Olm.Account, storageKey: Uint8Array) {
  const pickled = account.pickle(pickleKey(storageKey))
  await putEncrypted(ACCOUNT_KEY, utf8ToBytes(pickled), storageKey)
}

export async function loadSession(dmKey: string, storageKey: Uint8Array): Promise<Olm.Session | null> {
  await ensureOlm()
  const pickled = await getEncrypted(sessionKey(dmKey), storageKey)
  if (!pickled) return null
  const session = new Olm.Session()
  session.unpickle(pickleKey(storageKey), bytesToUtf8(pickled))
  return session
}

export async function persistSession(dmKey: string, session: Olm.Session, storageKey: Uint8Array) {
  const pickled = session.pickle(pickleKey(storageKey))
  await putEncrypted(sessionKey(dmKey), utf8ToBytes(pickled), storageKey)
}

export type PeerBundle = {
  identity: string
  signing: string
  otkId: string
  otk: string
}

// Bundle authentication: NOT cryptographically guaranteed in v1. The wire
// format trusts that whoever posted a handshake message in the chat is the
// participant we expect. An ACTIVE backend can substitute a forged bundle on
// first contact; we accept this since the agreed threat model is
// passive-attacker-only (see plan: "Risks and follow-ups → Active-MITM
// detection"). Future work: bind the Olm identity key to the user's wallet
// via a one-time wallet-signed attestation included in the bundle, so peers
// can verify the bundle came from the wallet that owns the chat participant
// address. Out of scope here.
export function exportBundle(account: Olm.Account): string {
  const identity = JSON.parse(account.identity_keys()) as { curve25519: string; ed25519: string }
  const otks = JSON.parse(account.one_time_keys()).curve25519 as Record<string, string>
  const otkId = Object.keys(otks)[0]
  if (!otkId) throw new Error('Out of one-time keys — call generate_one_time_keys')
  const bundle: PeerBundle = {
    identity: identity.curve25519,
    signing: identity.ed25519,
    otkId,
    otk: otks[otkId]!,
  }
  account.mark_keys_as_published()
  return bytesToBase64(utf8ToBytes(JSON.stringify(bundle)))
}

export function parseBundle(encoded: string): PeerBundle {
  return JSON.parse(bytesToUtf8(base64ToBytes(encoded))) as PeerBundle
}
