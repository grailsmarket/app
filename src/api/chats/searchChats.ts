import { API_URL } from '@/constants/api'
import type { APIResponseType } from '@/types/api'
import type { Chat } from '@/types/chat'
import { authFetch } from '../authFetch'

/**
 * GET /chats/search?q= — the caller's DMs whose counterparty matches the query.
 * The backend resolves a name fragment against the ENS subgraph constrained to
 * the caller's own peer addresses (complete recall), or prefix-matches a typed
 * address. Returns inbox-shaped rows.
 */
export const searchChats = async (q: string): Promise<Chat[]> => {
  const params = new URLSearchParams({ q })

  const response = await authFetch(`${API_URL}/chats/search?${params.toString()}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })

  const json = (await response.json()) as APIResponseType<{ chats: Chat[] }>

  if (!response.ok || !json.success) {
    throw new Error(json.error?.message ?? `Failed to search chats: ${response.status}`)
  }

  return json.data.chats
}
