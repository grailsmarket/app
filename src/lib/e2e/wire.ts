'use client'
import Olm from '@matrix-org/olm'
import { ensureOlm, type PeerBundle } from './olm'

// `did` is reserved for future Sesame-style multi-device fan-out. Single-device
// clients omit it; readers ignore it.
export type E2EMsgEnvelope = {
  v: 1
  kind: 'msg'
  type: 0 | 1
  ct: string
  mid?: string
  did?: string
}
export type E2EHandshakeEnvelope = { v: 1; kind: 'hs'; bundle: string }
export type E2EBody = { __e2e: E2EMsgEnvelope } | { __e2e: E2EHandshakeEnvelope }

const HANDSHAKE_DISPLAY = '🔐 Encryption setup'

export function encodeMsg(env: E2EMsgEnvelope): string {
  return JSON.stringify({ __e2e: env })
}
export function encodeHandshake(env: E2EHandshakeEnvelope): string {
  return JSON.stringify({ __e2e: env })
}
export function handshakeDisplay(): string {
  return HANDSHAKE_DISPLAY
}

export function tryDecode(body: string | null | undefined): E2EBody['__e2e'] | null {
  if (!body || body.length < 10 || body[0] !== '{') return null
  let parsed: unknown
  try {
    parsed = JSON.parse(body)
  } catch {
    return null
  }
  const env = (parsed as { __e2e?: unknown }).__e2e
  if (!env || typeof env !== 'object') return null
  const e = env as { v?: number; kind?: string }
  if (e.v !== 1) return null
  if (e.kind === 'msg' || e.kind === 'hs') return env as E2EBody['__e2e']
  return null
}

export function isMsgEnvelope(env: E2EBody['__e2e']): env is E2EMsgEnvelope {
  return env.kind === 'msg'
}
export function isHandshakeEnvelope(env: E2EBody['__e2e']): env is E2EHandshakeEnvelope {
  return env.kind === 'hs'
}

export function encryptForPeer(session: Olm.Session, plaintext: string, mid?: string): E2EMsgEnvelope {
  const r = session.encrypt(plaintext)
  return { v: 1, kind: 'msg', type: r.type as 0 | 1, ct: r.body, mid }
}

export function decryptFromPeer(session: Olm.Session, ciphertext: string, type: 0 | 1): string {
  return session.decrypt(type, ciphertext)
}

export async function createOutboundSession(account: Olm.Account, peer: PeerBundle): Promise<Olm.Session> {
  await ensureOlm()
  const session = new Olm.Session()
  session.create_outbound(account, peer.identity, peer.otk)
  return session
}

// Inbound session from a pre-key message (type 0). Olm consumes one of the
// account's one-time keys on creation, so we return both the new session and
// the decrypted plaintext.
export async function createInboundSessionFromPrekey(
  account: Olm.Account,
  ciphertext: string,
): Promise<{ session: Olm.Session; plaintext: string }> {
  await ensureOlm()
  const session = new Olm.Session()
  session.create_inbound(account, ciphertext)
  account.remove_one_time_keys(session)
  const plaintext = session.decrypt(0, ciphertext)
  return { session, plaintext }
}
