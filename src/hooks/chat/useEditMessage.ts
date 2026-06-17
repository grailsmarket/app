'use client'

import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { editMessage } from '@/api/chats/editMessage'
import type { ChatMessage, ChatMessagesResponse } from '@/types/chat'
import { messagesQueryKeyForChat } from './useToggleReaction'

interface EditVariables {
  messageId: string
  body: string
}

/**
 * Edits the caller's own message body with an optimistic cache patch (sets
 * `body` + a provisional `edited_at`) and full-snapshot rollback on error.
 * Works for DMs and the global room. Patches only body/edited_at so cached
 * reactions are preserved (the server response/WS event carry `reactions: []`).
 */
export const useEditMessage = (chatId: string) => {
  const queryClient = useQueryClient()
  const queryKey = messagesQueryKeyForChat(chatId)

  const patchBody = (messageId: string, body: string, editedAt: string) => {
    queryClient.setQueryData<InfiniteData<ChatMessagesResponse>>(queryKey, (old) => {
      if (!old) return old
      return {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          messages: page.messages.map((m) => (m.id === messageId ? { ...m, body, edited_at: editedAt } : m)),
        })),
      }
    })
  }

  return useMutation({
    mutationFn: async ({ messageId, body }: EditVariables): Promise<ChatMessage> => {
      return editMessage(chatId, messageId, body)
    },
    onMutate: async ({ messageId, body }) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<InfiniteData<ChatMessagesResponse>>(queryKey)
      patchBody(messageId, body, new Date().toISOString())
      return { previous }
    },
    onSuccess: (serverMessage) => {
      // Reconcile with the authoritative body + edited_at from the server.
      patchBody(serverMessage.id, serverMessage.body ?? '', serverMessage.edited_at ?? new Date().toISOString())
    },
    onError: (err, _vars, ctx) => {
      console.error('[chat] edit failed', err)
      if (ctx?.previous) {
        queryClient.setQueryData(queryKey, ctx.previous)
      }
    },
  })
}
