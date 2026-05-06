'use client'
// Type-only import: see olm.ts for why the runtime is loaded via script tag.
import type Olm from '@matrix-org/olm'
import { ensureOlm, type PeerBundle } from './olm'

function olmRuntime(): typeof Olm {
  if (typeof window === 'undefined' || !window.Olm) {
    throw new Error('Olm runtime not initialized — call ensureOlm() first')
  }
  return window.Olm
}

// Single-device legacy envelope. Senders no longer emit this; receivers
// continue to decode it for backward compatibility.
export type E2EMsgEnvelope = {
  v: 1
  kind: 'msg'
  type: 0 | 1
  ct: string
  mid?: string
}

// Sesame-style fanout: one ciphertext per recipient device (peer's devices +
// our own other devices). Each `cts` entry is independently encrypted under
// the (sender, recipient_device) pairwise Olm session. `sender_did` is the
// sender's Olm identity (curve25519) so receivers know which session to use.
export type E2EFanoutCiphertext = { did: string; type: 0 | 1; ct: string }
export type E2EFanoutEnvelope = {
  v: 1
  kind: 'fanout'
  sender_did: string
  mid?: string
  cts: E2EFanoutCiphertext[]
}

export type E2EHandshakeEnvelope = { v: 1; kind: 'hs'; bundle: string }
export type E2EBody =
  | { __e2e: E2EMsgEnvelope }
  | { __e2e: E2EHandshakeEnvelope }
  | { __e2e: E2EFanoutEnvelope }

const HANDSHAKE_DISPLAY = '🔐 Encryption setup'

export function encodeMsg(env: E2EMsgEnvelope): string {
  return JSON.stringify({ __e2e: env })
}
export function encodeFanout(env: E2EFanoutEnvelope): string {
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
  if (e.kind === 'msg' || e.kind === 'hs' || e.kind === 'fanout') return env as E2EBody['__e2e']
  return null
}

export function isMsgEnvelope(env: E2EBody['__e2e']): env is E2EMsgEnvelope {
  return env.kind === 'msg'
}
export function isFanoutEnvelope(env: E2EBody['__e2e']): env is E2EFanoutEnvelope {
  return env.kind === 'fanout'
}
export function isHandshakeEnvelope(env: E2EBody['__e2e']): env is E2EHandshakeEnvelope {
  return env.kind === 'hs'
}

// True if the message represents an outbound or inbound encrypted payload
// (msg or fanout) — i.e. anything `useDecryptedBody` will need to decrypt.
export function isCiphertextEnvelope(
  env: E2EBody['__e2e']
): env is E2EMsgEnvelope | E2EFanoutEnvelope {
  return env.kind === 'msg' || env.kind === 'fanout'
}

export function findOwnCiphertext(env: E2EFanoutEnvelope, ownDid: string): E2EFanoutCiphertext | null {
  return env.cts.find((c) => c.did === ownDid) ?? null
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
  const Olm = olmRuntime()
  const session = new Olm.Session()
  // Prefer the fallback key — it survives multiple create_outbound calls from
  // different peer devices, where a single OTK would be consumed after the
  // first peer's pre-key message reaches us. Falls back to the legacy single
  // OTK for handshakes published by older clients.
  const key = peer.fallback_key ?? peer.otk
  if (!key) throw new Error('Bundle missing fallback_key and otk')
  session.create_outbound(account, peer.identity, key)
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
  const Olm = olmRuntime()
  const session = new Olm.Session()
  session.create_inbound(account, ciphertext)
  account.remove_one_time_keys(session)
  const plaintext = session.decrypt(0, ciphertext)
  return { session, plaintext }
}
