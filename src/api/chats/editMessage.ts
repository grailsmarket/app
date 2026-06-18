import { API_URL } from '@/constants/api'
import type { APIResponseType } from '@/types/api'
import type { ChatMessage } from '@/types/chat'
import { authFetch } from '../authFetch'

/**
 * PATCH /chats/:chatId/messages/:messageId — edit the caller's own message body.
 * Works for DMs and the global room (pass GLOBAL_CHAT_ID). Returns the updated
 * message (the response carries `reactions: []`; callers should patch only
 * `body` + `edited_at` and keep their cached reactions).
 */
export const editMessage = async (chatId: string, messageId: string, body: string): Promise<ChatMessage> => {
  const response = await authFetch(`${API_URL}/chats/${chatId}/messages/${messageId}`, {
    method: 'PATCH',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ body }),
  })

  const json = (await response.json()) as APIResponseType<{ message: ChatMessage }>

  if (!response.ok || !json.success) {
    throw new Error(json.error?.message ?? `Failed to edit message: ${response.status}`)
  }

  return json.data.message
}
