import { keccak_256 } from '@noble/hashes/sha3'
import { hkdf } from '@noble/hashes/hkdf'
import { sha256 } from '@noble/hashes/sha256'
import { hexToBytes } from 'viem'
import type { Hex } from 'viem'

export const HANDSHAKE_MSG =
  'Grails encrypted DM — sign to unlock your encryption keys on this device.\n\n' +
  'This signature is deterministic and stays on your device. Do not sign this anywhere else.\n\n' +
  'Version: 1'

// Master key derived from the wallet signature. NOT used directly anywhere —
// callers derive purpose-specific subkeys via `deriveSubkey` to keep the
// secretbox-at-rest key and the Olm pickle key cryptographically independent.
export function deriveStorageKey(signature: Hex): Uint8Array {
  return keccak_256(hexToBytes(signature)).slice(0, 32)
}

// HKDF-SHA256 with a fixed app-scoped salt and a usage-specific info string.
// The two purposes ("secretbox" and "pickle") MUST never share a key — Olm's
// pickle format and nacl.secretbox's nonce/key handling diverge in ways that
// would create a cross-protocol footgun if the same 32 bytes were fed to both.
const HKDF_SALT = new TextEncoder().encode('grails-e2e:v1')
export function deriveSubkey(storageKey: Uint8Array, info: string): Uint8Array {
  return hkdf(sha256, storageKey, HKDF_SALT, info, 32)
}
