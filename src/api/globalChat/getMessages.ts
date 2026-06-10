import { API_URL } from '@/constants/api'
import type { APIResponseType } from '@/types/api'
import type { ChatMessagesResponse } from '@/types/chat'
import { maybeAuthFetch } from '../authFetch/maybeAuthFetch'

interface GetGlobalMessagesParams {
  before?: string
  limit?: number
}

/**
 * GET /chats/global/messages — cursor pagination, newest-first. PUBLIC; when a
 * token cookie exists the Authorization header is sent so `reacted` flags are
 * personalized for the caller.
 */
export const getGlobalMessages = async ({
  before,
  limit = 50,
}: GetGlobalMessagesParams = {}): Promise<ChatMessagesResponse> => {
  const params = new URLSearchParams()
  params.set('limit', String(limit))
  if (before) params.set('before', before)

  const response = await maybeAuthFetch(`${API_URL}/chats/global/messages?${params.toString()}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch global messages: ${response.status}`)
  }

  const json = (await response.json()) as APIResponseType<ChatMessagesResponse>
  return json.data
}
