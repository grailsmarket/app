import { API_URL } from '@/constants/api'
import type { APIResponseType } from '@/types/api'
import { authFetch } from '../authFetch'

interface MarkReadResponse {
  chat_id: string
  last_read_message_id: string
}

/** POST /chats/:id/read — sets caller's last_read_message_id. */
export const markRead = async ({
  chatId,
  upToMessageId,
}: {
  chatId: string
  upToMessageId: string
}): Promise<MarkReadResponse> => {
  const response = await authFetch(`${API_URL}/chats/${chatId}/read`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ up_to_message_id: upToMessageId }),
  })

  if (!response.ok) {
    throw new Error(`Failed to mark read: ${response.status}`)
  }

  const json = (await response.json()) as APIResponseType<MarkReadResponse>
  return json.data
}
