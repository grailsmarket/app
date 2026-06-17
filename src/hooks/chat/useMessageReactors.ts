'use client'

import { useQuery } from '@tanstack/react-query'
import { getMessageReactions } from '@/api/chats/reactions'

/**
 * Lazily fetches who reacted to a message (grouped by emoji). Pass enabled=true
 * only when a reactors popover is open so we don't fetch for every rendered
 * message. Keyed by messageId (globally unique), shared across that message's
 * pills. Never fetches for optimistic (not-yet-persisted) messages.
 */
export const useMessageReactors = (chatId: string, messageId: string, enabled: boolean) => {
  return useQuery({
    queryKey: ['messageReactors', messageId],
    queryFn: () => getMessageReactions(chatId, messageId),
    enabled: enabled && !messageId.startsWith('optimistic-'),
    staleTime: 15_000,
  })
}
