'use client'

import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { sendGlobalMessage, type SendGlobalMessageError } from '@/api/globalChat/sendMessage'
import { GLOBAL_CHAT_ID } from '@/constants/chat'
import type { ChatMessage, ChatMessagesResponse } from '@/types/chat'
import { useUserContext } from '@/context/user'

interface MessagesPage extends ChatMessagesResponse {}

/**
 * Global-room twin of useSendMessage: optimistically appends to the
 * ['globalChat', 'messages'] cache and rolls back on failure. The canonical
 * server-broadcast `chat:message_new` event carries the same UUID and replaces
 * the optimistic copy in useChatSocket via id-based dedupe.
 */
export const useSendGlobalMessage = () => {
  const queryClient = useQueryClient()
  const { userAddress } = useUserContext()

  return useMutation<ChatMessage, SendGlobalMessageError, string, { tempId: string } | undefined>({
    mutationFn: async (body: string) => {
      const result = await sendGlobalMessage(body)
      return result.message
    },
    onMutate: async (body) => {
      await queryClient.cancelQueries({ queryKey: ['globalChat', 'messages'] })

      const tempId = `optimistic-${Date.now()}-${Math.random().toString(36).slice(2)}`
      const optimistic: ChatMessage = {
        id: tempId,
        chat_id: GLOBAL_CHAT_ID,
        sender_user_id: -1,
        sender_address: userAddress?.toLowerCase(),
        body,
        content_type: 'text',
        metadata: { optimistic: true },
        created_at: new Date().toISOString(),
        edited_at: null,
        deleted_at: null,
        reactions: [],
      }

      queryClient.setQueryData<InfiniteData<MessagesPage>>(['globalChat', 'messages'], (old) => {
        if (!old || old.pages.length === 0) {
          return {
            pageParams: [undefined],
            pages: [{ messages: [optimistic], nextCursor: null }],
          }
        }
        const [first, ...rest] = old.pages
        return {
          ...old,
          pages: [{ ...first, messages: [optimistic, ...first.messages] }, ...rest],
        }
      })

      return { tempId }
    },
    onSuccess: (serverMessage, _body, ctx) => {
      // Defensive fallback: keep the optimistic sender_address if the server
      // response is missing it so the row stays attributed to the caller.
      const merged: ChatMessage = {
        ...serverMessage,
        sender_address: serverMessage.sender_address ?? userAddress?.toLowerCase(),
      }
      queryClient.setQueryData<InfiniteData<MessagesPage>>(['globalChat', 'messages'], (old) => {
        if (!old) return old
        // If the canonical id is already in the cache (WS arrived first and
        // replaced our optimistic placeholder, or appended), just drop the
        // optimistic row by id — never let both coexist.
        const realIdExists = old.pages.some((p) => p.messages.some((m) => m.id === merged.id))
        if (realIdExists) {
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              messages: page.messages.filter((m) => m.id !== ctx?.tempId),
            })),
          }
        }
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            messages: page.messages.map((m) => (m.id === ctx?.tempId ? merged : m)),
          })),
        }
      })
    },
    onError: (_err, _body, ctx) => {
      if (!ctx) return
      queryClient.setQueryData<InfiniteData<MessagesPage>>(['globalChat', 'messages'], (old) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            messages: page.messages.filter((m) => m.id !== ctx.tempId),
          })),
        }
      })
    },
    onSettled: () => {
      // Every send (success or quota error) changes the caller's daily quota.
      queryClient.invalidateQueries({ queryKey: ['globalChat', 'quota'] })
    },
  })
}
