'use client'

import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { deleteMessage } from '@/api/chats/deleteMessage'
import type { ChatMessagesResponse } from '@/types/chat'
import { messagesQueryKeyForChat } from './useToggleReaction'

/**
 * Soft-deletes the caller's own message with an optimistic cache patch and
 * full-snapshot rollback on error. Works for DMs and the global room. The
 * canonical `chat:message_deleted` WS event re-applies the same patch (with the
 * authoritative `deleted_by_admin`), so this is idempotent with the socket.
 */
export const useDeleteMessage = (chatId: string) => {
  const queryClient = useQueryClient()
  const queryKey = messagesQueryKeyForChat(chatId)

  return useMutation({
    mutationFn: async (messageId: string): Promise<void> => {
      await deleteMessage(chatId, messageId)
    },
    onMutate: async (messageId) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<InfiniteData<ChatMessagesResponse>>(queryKey)
      queryClient.setQueryData<InfiniteData<ChatMessagesResponse>>(queryKey, (old) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            messages: page.messages.map((m) =>
              // Self-delete → deleted_by_admin: false.
              m.id === messageId
                ? { ...m, body: null, deleted_at: new Date().toISOString(), deleted_by_admin: false }
                : m
            ),
          })),
        }
      })
      return { previous }
    },
    onError: (err, _messageId, ctx) => {
      console.error('[chat] delete failed', err)
      if (ctx?.previous) {
        queryClient.setQueryData(queryKey, ctx.previous)
      }
    },
  })
}
