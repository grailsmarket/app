import { API_URL } from '@/constants/api'
import type { APIResponseType } from '@/types/api'
import type { ChatMessagesResponse } from '@/types/chat'
import { authFetch } from '../authFetch'

interface GetGlobalMessagesParams {
  before?: string
  limit?: number
  isAuthenticated?: boolean
}

/**
 * GET /chats/global/messages — cursor pagination, newest-first. PUBLIC; when
 * the caller is authenticated the Authorization header is sent so `reacted`
 * flags are personalized for them.
 */
export const getGlobalMessages = async ({
  before,
  limit = 50,
  isAuthenticated = false,
}: GetGlobalMessagesParams = {}): Promise<ChatMessagesResponse> => {
  const params = new URLSearchParams()
  params.set('limit', String(limit))
  if (before) params.set('before', before)

  const fetchFunction = isAuthenticated ? authFetch : fetch
  const response = await fetchFunction(`${API_URL}/chats/global/messages?${params.toString()}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch global messages: ${response.status}`)
  }

  const json = (await response.json()) as APIResponseType<ChatMessagesResponse>
  return json.data
}
