import { API_URL } from '@/constants/api'
import type { APIResponseType } from '@/types/api'
import { authFetch } from '../authFetch'

export interface PeerEncryptionKey {
  address: string
  publicKey: string
  signature: `0x${string}`
}

/**
 * GET /users/:address/encryption-key — fetch a peer's published X25519 pubkey
 * and the binding signature so the caller can verify it against the peer's
 * wallet address before encrypting.
 *
 * Returns null when the peer has not published a key yet.
 */
export const getEncryptionKey = async (address: string): Promise<PeerEncryptionKey | null> => {
  const response = await authFetch(`${API_URL}/users/${address.toLowerCase()}/encryption-key`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })

  if (response.status === 404) return null
  if (!response.ok) throw new Error(`Failed to fetch encryption key (${response.status})`)

  const json = (await response.json()) as APIResponseType<PeerEncryptionKey | null>
  return json.data ?? null
}
