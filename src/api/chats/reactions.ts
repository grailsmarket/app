import { API_URL } from '@/constants/api'
import type { APIResponseType } from '@/types/api'
import { authFetch } from '../authFetch'

/**
 * POST /chats/:chatId/messages/:messageId/reactions — add an emoji reaction.
 * Idempotent: `added` is false when the reaction already existed.
 * Works for DMs and the global room (pass GLOBAL_CHAT_ID).
 */
export const addReaction = async (chatId: string, messageId: string, emoji: string): Promise<{ added: boolean }> => {
  const response = await authFetch(`${API_URL}/chats/${chatId}/messages/${messageId}/reactions`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ emoji }),
  })

  const json = (await response.json()) as APIResponseType<{ added: boolean }>

  if (!response.ok || !json.success) {
    throw new Error(json.error?.message ?? `Failed to add reaction: ${response.status}`)
  }

  return json.data
}

/**
 * DELETE /chats/:chatId/messages/:messageId/reactions/:emoji — remove the
 * caller's reaction. 404 REACTION_NOT_FOUND is treated as success (already gone).
 */
export const removeReaction = async (
  chatId: string,
  messageId: string,
  emoji: string
): Promise<{ removed: boolean }> => {
  const response = await authFetch(
    `${API_URL}/chats/${chatId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`,
    {
      method: 'DELETE',
      headers: { Accept: 'application/json' },
    }
  )

  const json = (await response.json()) as APIResponseType<{ removed: boolean }>

  if (!response.ok || !json.success) {
    // Already absent — the desired end state, treat as success.
    if (response.status === 404 && json.error?.code === 'REACTION_NOT_FOUND') {
      return { removed: false }
    }
    throw new Error(json.error?.message ?? `Failed to remove reaction: ${response.status}`)
  }

  return json.data
}
