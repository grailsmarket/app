import { keccak_256 } from '@noble/hashes/sha3'
import { hexToBytes } from 'viem'
import type { Hex } from 'viem'

export const HANDSHAKE_MSG =
  'Grails encrypted DM — sign to unlock your encryption keys on this device.\n\n' +
  'This signature is deterministic and stays on your device. Do not sign this anywhere else.\n\n' +
  'Version: 1'

// 32-byte symmetric key derived from a wallet signature. Used solely to encrypt
// at-rest IndexedDB blobs; never used as a Curve25519 key.
export function deriveStorageKey(signature: Hex): Uint8Array {
  return keccak_256(hexToBytes(signature)).slice(0, 32)
}
