'use client'

import { useQuery, type QueryKey } from '@tanstack/react-query'
import { getMessageReactions } from '@/api/chats/reactions'

/** Query key for a single message's reactor list, scoped by chatId + messageId. */
export const messageReactorsQueryKey = (chatId: string, messageId: string): QueryKey => [
  'messageReactors',
  chatId,
  messageId,
]

/**
 * Lazily fetches who reacted to a message (grouped by emoji). Pass enabled=true
 * only when a reactors popover is open so we don't fetch for every rendered
 * message. Keyed by chatId + messageId, shared across that message's pills.
 * Never fetches for optimistic (not-yet-persisted) messages.
 */
export const useMessageReactors = (chatId: string, messageId: string, enabled: boolean) => {
  return useQuery({
    queryKey: messageReactorsQueryKey(chatId, messageId),
    queryFn: () => getMessageReactions(chatId, messageId),
    enabled: enabled && !messageId.startsWith('optimistic-'),
    staleTime: 15_000,
  })
}
