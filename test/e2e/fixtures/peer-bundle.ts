// Generate a real Olm handshake bundle for a fake peer device. Used by the
// mock-backend layer to seed `GET /messages` with a "peer already published
// their bundle" row so the app's cache-scan path consumes it and walks the
// real consumePeerBundle code path. No crypto stubbing.
//
// Runs Node-side (inside the Playwright test process), not in the browser
// under test. The bundle is just a base64 string by the time it reaches the
// app — opaque to the app, the peer-side Olm Account that produced it stays
// in this process.
import Olm from '@matrix-org/olm'

let olmReady: Promise<void> | null = null
function ensureOlm(): Promise<void> {
  if (!olmReady) olmReady = Olm.init()
  return olmReady
}

export type FakePeer = {
  /** Base64-encoded handshake bundle to embed in a chat message body. */
  bundle: string
  /** Curve25519 identity — useful for distinguishing rows in the message list. */
  identity: string
}

export async function createFakePeer(): Promise<FakePeer> {
  await ensureOlm()
  const account = new Olm.Account()
  account.create()
  account.generate_one_time_keys(50)
  account.generate_fallback_key()

  const identityKeys = JSON.parse(account.identity_keys()) as {
    curve25519: string
    ed25519: string
  }
  const fallbackKeys = JSON.parse(account.fallback_key()) as {
    curve25519?: Record<string, string>
  }
  const fallback_key = fallbackKeys.curve25519
    ? Object.values(fallbackKeys.curve25519)[0]
    : undefined
  if (!fallback_key) throw new Error('fixture: no fallback key generated')

  account.mark_keys_as_published()

  // Match the shape src/lib/e2e/olm.ts exportBundle() produces.
  const bundle = {
    identity: identityKeys.curve25519,
    signing: identityKeys.ed25519,
    fallback_key,
  }
  const bundleEncoded = Buffer.from(JSON.stringify(bundle), 'utf8').toString('base64')

  // We intentionally leak this Olm.Account — the test process exits at the
  // end and the WASM heap is reclaimed. Freeing it would invalidate the
  // bundle's references in the (theoretical) case where the test wanted to
  // continue interacting as the peer.

  return { bundle: bundleEncoded, identity: identityKeys.curve25519 }
}

/** Wrap a bundle in the same envelope the app emits via encodeHandshake(). */
export function encodeHandshakeBody(bundle: string): string {
  return JSON.stringify({ __e2e: { v: 1, kind: 'hs', bundle } })
}

/** Predicate used by the mock backend to count handshake POSTs. */
export function isHandshakeBody(body: string): boolean {
  try {
    const parsed = JSON.parse(body) as { __e2e?: { v?: number; kind?: string; bundle?: string } }
    return (
      parsed.__e2e?.v === 1 &&
      parsed.__e2e.kind === 'hs' &&
      typeof parsed.__e2e.bundle === 'string'
    )
  } catch {
    return false
  }
}
