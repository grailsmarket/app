import { API_URL } from '@/constants/api'
import type { APIResponseType } from '@/types/api'
import type { Chat } from '@/types/chat'
import { authFetch } from '../authFetch'

/** GET /chats/:id — full chat with all participants and their read state. */
export const getChat = async (chatId: string): Promise<Chat> => {
  const response = await authFetch(`${API_URL}/chats/${chatId}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch chat: ${response.status}`)
  }

  const json = (await response.json()) as APIResponseType<{ chat: Chat }>
  return json.data.chat
}
