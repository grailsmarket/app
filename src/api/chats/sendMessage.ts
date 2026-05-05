import { API_URL } from '@/constants/api'
import type { APIResponseType } from '@/types/api'
import type { ChatMessage } from '@/types/chat'
import { authFetch } from '../authFetch'

export interface SendMessageError {
  status: number
  code: string
  message: string
}

/** POST /chats/:id/messages — send a text message. */
export const sendMessage = async ({ chatId, body }: { chatId: string; body: string }): Promise<ChatMessage> => {
  const response = await authFetch(`${API_URL}/chats/${chatId}/messages`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ body }),
  })

  const json = (await response.json()) as APIResponseType<{ message: ChatMessage }>

  if (!response.ok || !json.success) {
    const err: SendMessageError = {
      status: response.status,
      code: json.error?.code ?? 'UNKNOWN_ERROR',
      message: json.error?.message ?? 'Failed to send message',
    }
    throw err
  }

  return json.data.message
}
