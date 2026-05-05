import type { BeforeSendFn } from 'posthog-js'

const REDACTED = '[REDACTED]'

const JWT_PATTERN = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g
// ECDSA signatures from SIWE / Seaport are 130+ hex chars
const LONG_SIGNATURE_PATTERN = /\b0x[a-fA-F0-9]{130,}\b/g
// Private keys, hashes, secrets — 64–128 hex chars (wallet addresses are 40)
const LONG_HEX_PATTERN = /\b0x[a-fA-F0-9]{64,128}\b/g
const BEARER_PATTERN = /(Bearer\s+)[A-Za-z0-9._~+/=-]{10,}/gi
const COOKIE_TOKEN_PATTERN = /\b(token|jwt|auth|session)\s*[=:]\s*([A-Za-z0-9._~+/=-]{16,})/gi

export function redactString(input: string): string {
  return input
    .replace(JWT_PATTERN, REDACTED)
    .replace(LONG_SIGNATURE_PATTERN, REDACTED)
    .replace(LONG_HEX_PATTERN, REDACTED)
    .replace(BEARER_PATTERN, `$1${REDACTED}`)
    .replace(COOKIE_TOKEN_PATTERN, (_match, key) => `${key}=${REDACTED}`)
}

// Walks rrweb console-plugin payloads inside $snapshot events and redacts
// each serialized arg. Other event types pass through unchanged.
export const redactCapturedEvent: BeforeSendFn = (event) => {
  if (!event || event.event !== '$snapshot') return event

  const snapshots = event.properties?.['$snapshot_data']
  if (!Array.isArray(snapshots)) return event

  for (const snap of snapshots) {
    // rrweb EventType.Plugin === 6
    if (!snap || snap.type !== 6) continue
    const data = snap.data
    if (!data || data.plugin !== 'rrweb/console@1') continue
    const args = data.payload?.payload
    if (!Array.isArray(args)) continue
    data.payload.payload = args.map((arg: unknown) => (typeof arg === 'string' ? redactString(arg) : arg))
  }

  return event
}
