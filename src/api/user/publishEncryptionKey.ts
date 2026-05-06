import { API_URL } from '@/constants/api'
import type { APIResponseType } from '@/types/api'
import { authFetch } from '../authFetch'

export interface PublishEncryptionKeyPayload {
  publicKey: string
  signature: `0x${string}`
}

/**
 * PUT /users/me/encryption-key — publish the caller's X25519 public key plus
 * the wallet signature binding it to their address.
 *
 * The backend is expected to:
 *   1. Verify `recoverAddress(bindingMessage(addr, publicKey), signature) === addr`
 *   2. Persist (publicKey, signature) on the user record
 *   3. Return the stored values for confirmation
 */
export const publishEncryptionKey = async ({
  publicKey,
  signature,
}: PublishEncryptionKeyPayload): Promise<{ publicKey: string; signature: string }> => {
  const response = await authFetch(`${API_URL}/users/me/encryption-key`, {
    method: 'PUT',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ publicKey, signature }),
  })

  const json = (await response.json()) as APIResponseType<{ publicKey: string; signature: string }>

  if (!response.ok || !json.success) {
    throw new Error(json.error?.message ?? `Failed to publish encryption key (${response.status})`)
  }

  return json.data
}
