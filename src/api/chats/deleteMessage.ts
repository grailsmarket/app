import { API_URL } from '@/constants/api'
import type { APIResponseType } from '@/types/api'
import { authFetch } from '../authFetch'

/**
 * DELETE /chats/:chatId/messages/:messageId — soft-delete the caller's own message.
 * Works for DMs and the global room (pass GLOBAL_CHAT_ID), same as reactions.
 */
export const deleteMessage = async (chatId: string, messageId: string): Promise<{ deleted: boolean }> => {
  const response = await authFetch(`${API_URL}/chats/${chatId}/messages/${messageId}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
  })

  const json = (await response.json()) as APIResponseType<{ deleted: boolean }>

  if (!response.ok || !json.success) {
    throw new Error(json.error?.message ?? `Failed to delete message: ${response.status}`)
  }

  return json.data
}
