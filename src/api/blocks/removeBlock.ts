import { API_URL } from '@/constants/api'
import type { APIResponseType } from '@/types/api'
import { authFetch } from '../authFetch'

interface RemoveBlockResponse {
  blocker_user_id: number
  blocked_user_id: number
}

/** DELETE /me/blocks/:userId — unblock. */
export const removeBlock = async (userId: number): Promise<RemoveBlockResponse> => {
  const response = await authFetch(`${API_URL}/me/blocks/${userId}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) {
    throw new Error(`Failed to remove block: ${response.status}`)
  }
  const json = (await response.json()) as APIResponseType<RemoveBlockResponse>
  return json.data
}
