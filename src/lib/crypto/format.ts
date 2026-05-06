/**
 * On-the-wire format for encrypted message bodies.
 *
 * `enc:v1:<base64(24-byte nonce || ciphertext-with-tag)>`
 *
 * The prefix lets us cheaply detect encrypted vs legacy plaintext bodies
 * without parsing. v1 uses XChaCha20-Poly1305 (24-byte nonce, 16-byte tag).
 */

export const ENC_PREFIX_V1 = 'enc:v1:'
const NONCE_BYTES = 24

const toBase64 = (bytes: Uint8Array): string => {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return typeof btoa === 'function' ? btoa(bin) : Buffer.from(bytes).toString('base64')
}

const fromBase64 = (b64: string): Uint8Array => {
  const bin = typeof atob === 'function' ? atob(b64) : Buffer.from(b64, 'base64').toString('binary')
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

export const isEncryptedBody = (body: string | null | undefined): body is string =>
  typeof body === 'string' && body.startsWith(ENC_PREFIX_V1)

export const packEncrypted = (nonce: Uint8Array, ciphertext: Uint8Array): string => {
  if (nonce.length !== NONCE_BYTES) throw new Error('bad nonce length')
  const combined = new Uint8Array(NONCE_BYTES + ciphertext.length)
  combined.set(nonce, 0)
  combined.set(ciphertext, NONCE_BYTES)
  return ENC_PREFIX_V1 + toBase64(combined)
}

export const unpackEncrypted = (body: string): { nonce: Uint8Array; ciphertext: Uint8Array } => {
  if (!isEncryptedBody(body)) throw new Error('not an encrypted body')
  const combined = fromBase64(body.slice(ENC_PREFIX_V1.length))
  if (combined.length < NONCE_BYTES + 16) throw new Error('encrypted payload too short')
  return {
    nonce: combined.subarray(0, NONCE_BYTES),
    ciphertext: combined.subarray(NONCE_BYTES),
  }
}

export const bytesToBase64 = toBase64
export const base64ToBytes = fromBase64
