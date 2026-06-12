import { API_URL } from '@/constants/api'
import type { ChatMessage, GlobalChatQuota, SendMessageError } from '@/types/chat'
import { authFetch } from '../authFetch'

export interface SendGlobalMessageResult {
  message: ChatMessage
  quota: GlobalChatQuota
}

interface SendGlobalMessageEnvelope {
  success: boolean
  data?: SendGlobalMessageResult
  error?: { code: string; message: string; details?: GlobalChatQuota }
}

/** POST /chats/global/messages — send a text message to the global room. */
export const sendGlobalMessage = async (body: string): Promise<SendGlobalMessageResult> => {
  const response = await authFetch(`${API_URL}/chats/global/messages`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ body }),
  })

  const json = (await response.json()) as SendGlobalMessageEnvelope

  if (!response.ok || !json.success || !json.data) {
    const err: SendMessageError = {
      status: response.status,
      code: json.error?.code ?? 'UNKNOWN_ERROR',
      message: json.error?.message ?? 'Failed to send message',
      quota: json.error?.details,
    }
    throw err
  }

  return json.data
}
