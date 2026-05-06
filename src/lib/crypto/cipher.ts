import { x25519 } from '@noble/curves/ed25519.js'
import { xchacha20poly1305 } from '@noble/ciphers/chacha.js'
import { hkdf } from '@noble/hashes/hkdf.js'
import { sha256 } from '@noble/hashes/sha2.js'
import { packEncrypted, unpackEncrypted } from './format'

const HKDF_INFO = new TextEncoder().encode('grails-messaging-v1/dm-shared-key')

/**
 * Derive a 32-byte symmetric key for a DM between two peers via X25519 ECDH +
 * HKDF-SHA256. Both sides compute the same shared secret because ECDH is
 * commutative — Alice ECDH(her priv, his pub) == Bob ECDH(his priv, her pub).
 */
const deriveSharedKey = (mySecretKey: Uint8Array, theirPublicKey: Uint8Array): Uint8Array => {
  const shared = x25519.getSharedSecret(mySecretKey, theirPublicKey)
  return hkdf(sha256, shared, undefined, HKDF_INFO, 32)
}

/**
 * Encrypt a plaintext string for a peer. Returns the on-wire `enc:v1:<base64>`
 * representation suitable for storage in the existing `body` field.
 */
export const encryptForPeer = (plaintext: string, mySecretKey: Uint8Array, theirPublicKey: Uint8Array): string => {
  const key = deriveSharedKey(mySecretKey, theirPublicKey)
  const nonce = crypto.getRandomValues(new Uint8Array(24))
  const cipher = xchacha20poly1305(key, nonce)
  const ciphertext = cipher.encrypt(new TextEncoder().encode(plaintext))
  return packEncrypted(nonce, ciphertext)
}

/**
 * Decrypt an on-wire `enc:v1:...` body sent by a peer. Throws if the payload
 * is malformed or the auth tag fails.
 */
export const decryptFromPeer = (packed: string, mySecretKey: Uint8Array, theirPublicKey: Uint8Array): string => {
  const { nonce, ciphertext } = unpackEncrypted(packed)
  const key = deriveSharedKey(mySecretKey, theirPublicKey)
  const cipher = xchacha20poly1305(key, nonce)
  const plaintext = cipher.decrypt(ciphertext)
  return new TextDecoder().decode(plaintext)
}
