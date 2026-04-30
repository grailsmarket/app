import { API_URL } from '@/constants/api'
import type { APIResponseType } from '@/types/api'
import type { ChatMessagesResponse } from '@/types/chat'
import { authFetch } from '../authFetch'

interface GetMessagesParams {
  chatId: string
  before?: string
  limit?: number
}

/**
 * GET /chats/:id/messages — cursor pagination, newest-first.
 * Pass `before` (a message id from the previous page's `nextCursor`) to fetch older messages.
 */
export const getMessages = async ({
  chatId,
  before,
  limit = 50,
}: GetMessagesParams): Promise<ChatMessagesResponse> => {
  const params = new URLSearchParams()
  params.set('limit', String(limit))
  if (before) params.set('before', before)

  const response = await authFetch(`${API_URL}/chats/${chatId}/messages?${params.toString()}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch messages: ${response.status}`)
  }

  const json = (await response.json()) as APIResponseType<ChatMessagesResponse>
  return json.data
}
