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
  const trimmed = query.trim()
  const debounced = useDebounce(trimmed, 250)
  const enabled = debounced.length >= MIN_CHAT_SEARCH_LEN

  const result = useQuery<Chat[]>({
    queryKey: ['chats', 'search', debounced],
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 15_000,
    queryFn: () => searchChats(debounced),
  })

  // True while a search is settling: the user has typed enough to search, but
  // results aren't final yet — either the request is in flight, or the debounce
  // hasn't caught up to the latest keystroke. Lets the list show skeletons
  // (instead of a premature "No chats found") until a search actually resolves.
  const isPending = trimmed.length >= MIN_CHAT_SEARCH_LEN && (result.isFetching || debounced !== trimmed)

  return { ...result, isPending }
}
