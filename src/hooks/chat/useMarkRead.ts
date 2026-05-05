'use client'

import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { markRead } from '@/api/chats/markRead'
import type { ChatInboxResponse } from '@/types/chat'

/**
 * Mutation that marks a chat as read up to a given message id.
 * Optimistically zeroes the inbox unread_count so the badge updates instantly.
 * The chat:read WS event echoes back to refresh other participants, but for
 * the caller's own state we prefer immediate cache patching.
 */
export const useMarkRead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ chatId, upToMessageId }: { chatId: string; upToMessageId: string }) =>
      markRead({ chatId, upToMessageId }),
    onMutate: async ({ chatId, upToMessageId }) => {
      await queryClient.cancelQueries({ queryKey: ['chats', 'inbox'] })

      queryClient.setQueryData<InfiniteData<ChatInboxResponse>>(['chats', 'inbox'], (old) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            chats: page.chats.map((c) =>
              c.id === chatId ? { ...c, last_read_message_id: upToMessageId, unread_count: 0 } : c
            ),
          })),
        }
      })

      // Also patch chat detail cache if open
      queryClient.setQueryData(['chats', chatId, 'detail'], (old: any) => {
        if (!old) return old
        return {
          ...old,
          // we don't track participant id here; the WS chat:read broadcast will refresh
        }
      })

      return undefined
    },
  })
}
