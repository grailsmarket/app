import { API_URL } from '@/constants/api'
import type { APIResponseType } from '@/types/api'
import type { CreateChatResponse } from '@/types/chat'
import { authFetch } from '../authFetch'

export interface CreateChatError {
  status: number
  code: string
  message: string
}

/**
 * POST /chats — find-or-create a direct chat with the given recipient (address or .eth name).
 * Throws a CreateChatError on non-2xx responses so callers can branch on `code`
 * (e.g. RECIPIENT_OPTED_OUT, BLOCKED, RECIPIENT_NOT_FOUND, SELF_CHAT_FORBIDDEN).
 */
export const createChat = async (recipient: string): Promise<CreateChatResponse> => {
  const response = await authFetch(`${API_URL}/chats`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipient }),
  })

  const json = (await response.json()) as APIResponseType<CreateChatResponse>

  if (!response.ok || !json.success) {
    const err: CreateChatError = {
      status: response.status,
      code: json.error?.code ?? 'UNKNOWN_ERROR',
      message: json.error?.message ?? 'Failed to create chat',
    }
    throw err
  }

  return json.data
}
