import { recoverMessageAddress } from 'viem'
import type { Address } from 'viem'
import type { ChatMessage, ChatParticipant } from '@/types/chat'
import type { StoredKeypair } from './keystore'
import { isEncryptedBody } from './format'
import { decryptFromPeer, encryptForPeer } from './cipher'
import { bindingMessage, publicKeyFromBase64, publicKeyToBase64 } from './derive'

/**
 * Find the other participant in a DM (the only participant whose address is
 * not the caller's). Returns null for self-chat or empty rosters.
 */
export const findPeer = (participants: ChatParticipant[], myAddress: string): ChatParticipant | null => {
  const me = myAddress.toLowerCase()
  return participants.find((p) => p.address.toLowerCase() !== me) ?? null
}

/**
 * Verify the binding signature attached to a peer's published encryption key
 * actually came from the peer's wallet. Without this check, a compromised
 * backend could substitute its own pubkey and silently MITM the conversation.
 */
export const verifyPeerKey = async (peer: ChatParticipant): Promise<Uint8Array | null> => {
  const pub = peer.public_encryption_key
  const sig = peer.public_encryption_key_signature
  if (!pub || !sig || !sig.startsWith('0x')) return null

  try {
    const recovered = await recoverMessageAddress({
      message: bindingMessage(peer.address as Address, pub),
      signature: sig as `0x${string}`,
    })
    if (recovered.toLowerCase() !== peer.address.toLowerCase()) return null
    return publicKeyFromBase64(pub)
  } catch {
    return null
  }
}

/**
 * Encrypt `plaintext` for delivery to `peer`. Throws if no key is available
 * or the binding signature does not verify.
 */
export const encryptForPeerParticipant = async (
  plaintext: string,
  myKeypair: StoredKeypair,
  peer: ChatParticipant
): Promise<string> => {
  const peerPub = await verifyPeerKey(peer)
  if (!peerPub) throw new Error('Peer has not enabled encrypted messaging')
  return encryptForPeer(plaintext, myKeypair.secretKey, peerPub)
}

/**
 * Returns a cloned message with `decrypted_body` populated when decryption
 * succeeds, `decryption_failed: true` when it does not, or the message
 * unchanged if `body` is plaintext (legacy messages).
 *
 * Synchronous: skips the binding-signature verification because that is an
 * async network/crypto call. Send-side code does the verification before
 * encrypting, so any received encrypted payload from a known peer pubkey is
 * already gated. Receiving-side decryption uses whatever pubkey the chat
 * detail cache has — caller is responsible for refreshing it as needed.
 */
export const tryDecryptMessage = (
  message: ChatMessage,
  myAddress: string,
  myKeypair: StoredKeypair | null,
  participants: ChatParticipant[]
): ChatMessage => {
  if (!message.body) return message
  if (!isEncryptedBody(message.body)) return message
  if (!myKeypair) return { ...message, decryption_failed: true }

  const peer = findPeer(participants, myAddress)
  if (!peer?.public_encryption_key) return { ...message, decryption_failed: true }

  try {
    const peerPub = publicKeyFromBase64(peer.public_encryption_key)
    const decrypted = decryptFromPeer(message.body, myKeypair.secretKey, peerPub)
    return { ...message, decrypted_body: decrypted, decryption_failed: false }
  } catch {
    return { ...message, decryption_failed: true }
  }
}

export { publicKeyToBase64 }
