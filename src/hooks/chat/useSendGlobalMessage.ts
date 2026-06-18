'use client'

import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { sendGlobalMessage } from '@/api/globalChat/sendMessage'
import { sendChatImage } from '@/api/chats/sendImage'
import { GLOBAL_CHAT_ID } from '@/constants/chat'
import type { ChatMessage, ChatMessagesResponse, GlobalChatQuota, SendMessageError, SendVars } from '@/types/chat'
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

  return useMutation<ChatMessage, SendMessageError, SendVars, { tempId: string } | undefined>({
    mutationFn: async ({ body, file, replyToId }) => {
      const result = file
        ? await sendChatImage({ chatId: GLOBAL_CHAT_ID, file, body, replyToId })
        : await sendGlobalMessage(body, replyToId)
      return result.message
    },
    onMutate: async ({ body, file, replyTo }) => {
      // Image sends skip the optimistic insert — the composer shows the upload
      // preview, and the canonical message lands via onSuccess / the WS event.
      if (file) return undefined
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
        reply_to: replyTo ?? null,
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
        const realIdExists = old.pages.some((p) => p.messages.some((m) => m.id === merged.id))
        // Image sends have no optimistic placeholder: prepend the canonical
        // message unless the WS broadcast already added it.
        if (!ctx?.tempId) {
          if (realIdExists) return old
          const [first, ...rest] = old.pages
          if (!first) return { pageParams: [undefined], pages: [{ messages: [merged], nextCursor: null }] }
          return { ...old, pages: [{ ...first, messages: [merged, ...first.messages] }, ...rest] }
        }
        // If the canonical id is already in the cache (WS arrived first and
        // replaced our optimistic placeholder, or appended), just drop the
        // optimistic row by id — never let both coexist.
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
      // optimistic update
      queryClient.setQueryData<GlobalChatQuota>(['globalChat', 'quota'], (old) => {
        if (!old) return old
        return {
          ...old,
          remaining: old.remaining ? old.remaining - 1 : null,
        }
      })

      // server update
      queryClient.invalidateQueries({ queryKey: ['globalChat', 'quota'] })
    },
  })
}
