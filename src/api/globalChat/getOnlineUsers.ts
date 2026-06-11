import { API_URL } from '@/constants/api'
import type { APIResponseType } from '@/types/api'
import type { OnlineUsersResponse } from '@/types/chat'

interface GetOnlineUsersParams {
  page?: number
  limit?: number
}

/**
 * GET /chats/global/online-users — users active within 24h, newest first.
 * PUBLIC and identical for every caller, so plain fetch (no Authorization
 * header) lets the response come from the API's Redis cache.
 */
export const getOnlineUsers = async ({
  page = 1,
  limit = 20,
}: GetOnlineUsersParams = {}): Promise<OnlineUsersResponse> => {
  const response = await fetch(`${API_URL}/chats/global/online-users?page=${page}&limit=${limit}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch online users: ${response.status}`)
  }

  const json = (await response.json()) as APIResponseType<OnlineUsersResponse>
  return json.data
}
