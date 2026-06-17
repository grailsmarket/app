'use client'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { searchChats } from '@/api/chats/searchChats'
import { useDebounce } from '@/hooks/useDebounce'
import type { Chat } from '@/types/chat'

export const MIN_CHAT_SEARCH_LEN = 2

/**
 * Search the caller's DMs by counterparty. The query is resolved server-side:
 * a name fragment is matched against the ENS subgraph constrained to the
 * caller's own chat peers (complete recall), and "0x…" prefix-matches the peer
 * address. The frontend just debounces and renders the resulting inbox rows.
 */
export const useChatSearch = (query: string) => {
  const debounced = useDebounce(query.trim(), 250)
  const enabled = debounced.length >= MIN_CHAT_SEARCH_LEN

  return useQuery<Chat[]>({
    queryKey: ['chats', 'search', debounced],
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 15_000,
    queryFn: () => searchChats(debounced),
  })
}
