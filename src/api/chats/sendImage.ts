import { API_URL } from '@/constants/api'
import { GLOBAL_CHAT_ID } from '@/constants/chat'
import type { ChatMessage, GlobalChatQuota, SendMessageError } from '@/types/chat'
import { authFetch } from '../authFetch'

export interface SendImageResult {
  message: ChatMessage
  /** Present for global-room sends — an image counts against the daily quota. */
  quota?: GlobalChatQuota
}

interface SendImageEnvelope {
  success: boolean
  data?: SendImageResult
  error?: { code: string; message: string; details?: GlobalChatQuota }
}

/**
 * POST a multipart image to the global room (chatId === GLOBAL_CHAT_ID) or a
 * DM/group. No Content-Type header — the browser sets the multipart boundary.
 */
export const sendChatImage = async ({
  chatId,
  file,
  body,
  replyToId,
}: {
  chatId: string
  file: File
  body?: string
  replyToId?: string
}): Promise<SendImageResult> => {
  const form = new FormData()
  form.append('file', file)
  if (body) form.append('body', body)
  if (replyToId) form.append('reply_to_message_id', replyToId)

  const path = chatId === GLOBAL_CHAT_ID ? '/chats/global/messages/image' : `/chats/${chatId}/messages/image`
  const response = await authFetch(`${API_URL}${path}`, { method: 'POST', body: form })

  const json = (await response.json()) as SendImageEnvelope

  if (!response.ok || !json.success || !json.data) {
    const err: SendMessageError = {
      status: response.status,
      code: json.error?.code ?? 'UNKNOWN_ERROR',
      message: json.error?.message ?? 'Failed to send image',
      quota: json.error?.details,
    }
    throw err
  }

  return json.data
}
