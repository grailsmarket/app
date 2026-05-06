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

type SignedBundle = { payload: string; sig: string }

// X3DH-style signed bundle. The Ed25519 signature over the JSON payload lets
// the peer detect handshake-time tampering by the backend (server can read the
// bundle, but cannot forge a new one without the signing key).
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
  const payload = JSON.stringify(bundle)
  const sig = account.sign(payload)
  account.mark_keys_as_published()
  const wrapper: SignedBundle = { payload, sig }
  return bytesToBase64(utf8ToBytes(JSON.stringify(wrapper)))
}

export function parseBundle(encoded: string): PeerBundle {
  const wrapper = JSON.parse(bytesToUtf8(base64ToBytes(encoded))) as SignedBundle
  const inner = JSON.parse(wrapper.payload) as PeerBundle
  const utility = new Olm.Utility()
  try {
    utility.ed25519_verify(inner.signing, wrapper.payload, wrapper.sig)
  } catch {
    throw new Error('Invalid handshake signature')
  } finally {
    utility.free()
  }
  return inner
}
