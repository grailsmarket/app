import { API_URL } from '@/constants/api'
import type { APIResponseType } from '@/types/api'
import type { GlobalChatInfo } from '@/types/chat'

/** GET /chats/global — public room info + image capability flags. */
export const getGlobalChatInfo = async (): Promise<GlobalChatInfo> => {
  const response = await fetch(`${API_URL}/chats/global`, {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch global chat info: ${response.status}`)
  }

  const json = (await response.json()) as APIResponseType<GlobalChatInfo>
  return json.data
}
