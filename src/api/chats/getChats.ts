import { API_URL } from '@/constants/api'
import type { APIResponseType } from '@/types/api'
import type { ChatInboxResponse } from '@/types/chat'
import { authFetch } from '../authFetch'

interface GetChatsParams {
  page?: number
  limit?: number
}

/** GET /chats — paginated inbox with last_message + unread_count + participants. */
export const getChats = async ({ page = 1, limit = 20 }: GetChatsParams = {}): Promise<ChatInboxResponse> => {
  const url = `${API_URL}/chats?page=${page}&limit=${limit}`
  const response = await authFetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch chats: ${response.status}`)
  }

  const json = (await response.json()) as APIResponseType<ChatInboxResponse>
  return json.data
}
