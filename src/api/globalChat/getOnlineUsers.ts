import { API_URL } from '@/constants/api'
import type { APIResponseType } from '@/types/api'
import type { OnlineUsersResponse } from '@/types/chat'
import { maybeAuthFetch } from '../authFetch/maybeAuthFetch'

interface GetOnlineUsersParams {
  page?: number
  limit?: number
}

/** GET /chats/global/online-users — users signed in within 24h, newest first. PUBLIC. */
export const getOnlineUsers = async ({
  page = 1,
  limit = 20,
}: GetOnlineUsersParams = {}): Promise<OnlineUsersResponse> => {
  const response = await maybeAuthFetch(`${API_URL}/chats/global/online-users?page=${page}&limit=${limit}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch online users: ${response.status}`)
  }

  const json = (await response.json()) as APIResponseType<OnlineUsersResponse>
  return json.data
}
