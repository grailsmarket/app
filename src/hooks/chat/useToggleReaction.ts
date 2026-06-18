'use client'

import { useMutation, useQueryClient, type InfiniteData, type QueryKey } from '@tanstack/react-query'
import { addReaction, removeReaction } from '@/api/chats/reactions'
import { GLOBAL_CHAT_ID } from '@/constants/chat'
import type { ChatMessagesResponse } from '@/types/chat'
import { patchMessageReaction } from './utils/reactionCachePatch'
import { messageReactorsQueryKey } from './useMessageReactors'

interface ToggleReactionVariables {
  messageId: string
  emoji: string
  currentlyReacted: boolean
}

export const messagesQueryKeyForChat = (chatId: string): QueryKey =>
  chatId === GLOBAL_CHAT_ID ? ['globalChat', 'messages'] : ['chats', chatId, 'messages']

/**
 * Adds/removes the caller's emoji reaction with an optimistic cache toggle and
 * full-snapshot rollback on error. Works for DMs and the global room.
 */
export const useToggleReaction = (chatId: string) => {
  const queryClient = useQueryClient()
  const queryKey = messagesQueryKeyForChat(chatId)

  return useMutation({
    mutationFn: async ({ messageId, emoji, currentlyReacted }: ToggleReactionVariables): Promise<void> => {
      if (currentlyReacted) {
        await removeReaction(chatId, messageId, emoji)
      } else {
        await addReaction(chatId, messageId, emoji)
      }
    },
    onMutate: async ({ messageId, emoji, currentlyReacted }) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<InfiniteData<ChatMessagesResponse>>(queryKey)
      patchMessageReaction(queryClient, queryKey, messageId, emoji, { kind: 'toggle-mine', add: !currentlyReacted })
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(queryKey, ctx.previous)
      }
    },
    onSettled: (_data, _err, { messageId }) => {
      // The pill counts are patched in-place above, but the reactors popover
      // ("who reacted") is a separate query — invalidate it (scoped to this
      // message) so re-opening within staleTime shows the fresh list.
      queryClient.invalidateQueries({ queryKey: messageReactorsQueryKey(chatId, messageId) })
    },
  })
}
