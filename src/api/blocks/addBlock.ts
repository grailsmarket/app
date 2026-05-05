import { API_URL } from '@/constants/api'
import type { APIResponseType } from '@/types/api'
import { authFetch } from '../authFetch'

export interface AddBlockError {
  status: number
  code: string
  message: string
}

interface AddBlockResponse {
  blocker_user_id: number
  blocked_user_id: number
  address: string
}

/** POST /me/blocks — block a user by address or .eth name. */
export const addBlock = async (user: string): Promise<AddBlockResponse> => {
  const response = await authFetch(`${API_URL}/me/blocks`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ user }),
  })

  const json = (await response.json()) as APIResponseType<AddBlockResponse>

  if (!response.ok || !json.success) {
    const err: AddBlockError = {
      status: response.status,
      code: json.error?.code ?? 'UNKNOWN_ERROR',
      message: json.error?.message ?? 'Failed to block user',
    }
    throw err
  }

  return json.data
}
