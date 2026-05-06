import { x25519 } from '@noble/curves/ed25519.js'
import { hkdf } from '@noble/hashes/hkdf.js'
import { sha256 } from '@noble/hashes/sha2.js'
import type { Address, Hex } from 'viem'
import { bytesToBase64, base64ToBytes } from './format'

/**
 * Deterministic message the user signs to seed their X25519 messaging keypair.
 *
 * Signing this is non-transactional — it derives the encryption key locally
 * from the resulting signature and never leaves the browser. As long as the
 * wallet uses RFC 6979 deterministic ECDSA (every major EOA wallet does) the
 * same address will produce the same signature and therefore the same keypair
 * across devices and re-installs.
 *
 * Bumping the version invalidates all existing keys and forces re-derivation.
 */
export const derivationMessage = (address: Address): string =>
  [
    'Grails Messaging — derive encryption key (v1)',
    '',
    'This signature derives the X25519 keypair used to encrypt your direct',
    'messages. It is NOT a transaction and costs no gas. The signature stays',
    'on this device and is never sent anywhere.',
    '',
    `Address: ${address.toLowerCase()}`,
  ].join('\n')

/**
 * Separate "binding" message the user signs once per account so the backend
 * cannot substitute a different public key without breaking the signature.
 *
 * Peers verify `recoverAddress(bindingMessage(addr, pub), signature) === addr`
 * before encrypting to a fetched key.
 */
export const bindingMessage = (address: Address, publicKeyBase64: string): string =>
  [
    'Grails Messaging — publish encryption key (v1)',
    '',
    'I authorize the X25519 public key below to receive direct messages on',
    'my behalf. Anyone messaging me will encrypt to this key.',
    '',
    `Address: ${address.toLowerCase()}`,
    `Public key (base64): ${publicKeyBase64}`,
  ].join('\n')

const HKDF_INFO = new TextEncoder().encode('grails-messaging-v1/x25519-seed')

/**
 * Convert a wallet signature into a 32-byte X25519 secret key via HKDF-SHA256,
 * then derive the matching public key.
 */
export const deriveKeypairFromSignature = (signature: Hex): { publicKey: Uint8Array; secretKey: Uint8Array } => {
  const hex = signature.startsWith('0x') ? signature.slice(2) : signature
  const sigBytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < sigBytes.length; i++) sigBytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)

  const seed = hkdf(sha256, sigBytes, undefined, HKDF_INFO, 32)
  const secretKey = new Uint8Array(seed)
  const publicKey = x25519.getPublicKey(secretKey)
  return { publicKey, secretKey }
}

export const publicKeyToBase64 = (publicKey: Uint8Array): string => bytesToBase64(publicKey)
export const publicKeyFromBase64 = (b64: string): Uint8Array => base64ToBytes(b64)
