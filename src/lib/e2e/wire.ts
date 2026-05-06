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

// Sesame-style fanout: one ciphertext per recipient device (peer's devices +
// our own other devices). Each `cts` entry is independently encrypted under
// the (sender, recipient_device) pairwise Olm session. `sender_did` is the
// sender's Olm identity (curve25519) so receivers know which session to use.
//
// We always emit fanout, even for single-recipient sends. The earlier
// single-device `kind: 'msg'` envelope had no sender_did, which forced the
// receiver to fall back to a "single known session" heuristic and key
// freshly-created inbound sessions by Olm's internal session_id (not the
// peer's identity), creating ghost sessions that subsequent fanouts couldn't
// reach. Always-fanout removes that footgun. The wire-size cost is ~50 bytes.
export type E2EFanoutCiphertext = { did: string; type: 0 | 1; ct: string }
export type E2EFanoutEnvelope = {
  v: 1
  kind: 'fanout'
  sender_did: string
  mid?: string
  cts: E2EFanoutCiphertext[]
}

export type E2EHandshakeEnvelope = { v: 1; kind: 'hs'; bundle: string }
export type E2EBody = { __e2e: E2EHandshakeEnvelope } | { __e2e: E2EFanoutEnvelope }

const HANDSHAKE_DISPLAY = '🔐 Encryption setup'

export function encodeFanout(env: E2EFanoutEnvelope): string {
  return JSON.stringify({ __e2e: env })
}
export function encodeHandshake(env: E2EHandshakeEnvelope): string {
  return JSON.stringify({ __e2e: env })
}
export function handshakeDisplay(): string {
  return HANDSHAKE_DISPLAY
}

// Strict structural validation: a malicious peer or backend could post a body
// that decodes as JSON with the right `kind` but mistyped fields, which would
// crash inside Olm or `findOwnCiphertext`. Reject anything that isn't a
// well-formed envelope of a kind we recognize.
function isFanoutCt(v: unknown): v is E2EFanoutCiphertext {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  return typeof o.did === 'string' && (o.type === 0 || o.type === 1) && typeof o.ct === 'string'
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
  const e = env as Record<string, unknown>
  if (e.v !== 1) return null
  if (e.kind === 'hs') {
    if (typeof e.bundle !== 'string') return null
    return { v: 1, kind: 'hs', bundle: e.bundle }
  }
  if (e.kind === 'fanout') {
    if (typeof e.sender_did !== 'string' || !Array.isArray(e.cts)) return null
    if (e.mid !== undefined && typeof e.mid !== 'string') return null
    if (!e.cts.every(isFanoutCt)) return null
    return {
      v: 1,
      kind: 'fanout',
      sender_did: e.sender_did,
      mid: e.mid as string | undefined,
      cts: e.cts as E2EFanoutCiphertext[],
    }
  }
  return null
}

export function isFanoutEnvelope(env: E2EBody['__e2e']): env is E2EFanoutEnvelope {
  return env.kind === 'fanout'
}
export function isHandshakeEnvelope(env: E2EBody['__e2e']): env is E2EHandshakeEnvelope {
  return env.kind === 'hs'
}

// True if the message represents an encrypted payload (fanout) — i.e.
// anything `useDecryptedBody` will need to decrypt.
export function isCiphertextEnvelope(env: E2EBody['__e2e']): env is E2EFanoutEnvelope {
  return env.kind === 'fanout'
}

export function findOwnCiphertext(env: E2EFanoutEnvelope, ownDid: string): E2EFanoutCiphertext | null {
  return env.cts.find((c) => c.did === ownDid) ?? null
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
