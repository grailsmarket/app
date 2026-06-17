import { API_URL } from '@/constants/api'
import type { APIResponseType } from '@/types/api'
import type { ReactionWithUsers } from '@/types/chat'
import { authFetch } from '../authFetch'

/**
 * GET /chats/:chatId/messages/:messageId/reactions — who reacted, grouped by
 * emoji with reactor addresses. Works for DMs and the global room (anonymous
 * reads succeed for the global room since the endpoint is optional-auth).
 */
export const getMessageReactions = async (chatId: string, messageId: string): Promise<ReactionWithUsers[]> => {
  const response = await authFetch(`${API_URL}/chats/${chatId}/messages/${messageId}/reactions`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })

  const json = (await response.json()) as APIResponseType<{ message_id: string; reactions: ReactionWithUsers[] }>

  if (!response.ok || !json.success) {
    throw new Error(json.error?.message ?? `Failed to load reactions: ${response.status}`)
  }

  return json.data.reactions
}

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
