import { API_URL } from '@/constants/api'
import type { APIResponseType } from '@/types/api'
import type { GlobalChatQuota } from '@/types/chat'
import { authFetch } from '../authFetch'

/** GET /chats/global/quota — the caller's daily message quota. */
export const getGlobalQuota = async (): Promise<GlobalChatQuota> => {
  const response = await authFetch(`${API_URL}/chats/global/quota`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch global chat quota: ${response.status}`)
  }

  const json = (await response.json()) as APIResponseType<GlobalChatQuota>
  return json.data
}
