'use client'

import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { sendMessage, type SendMessageError } from '@/api/chats/sendMessage'
import type { ChatMessage, ChatMessagesResponse } from '@/types/chat'
import { useUserContext } from '@/context/user'

interface MessagesPage extends ChatMessagesResponse {}

/**
 * Optimistically appends the message to the messages cache and rolls back on failure.
 * The canonical server-broadcast `chat:message_new` event carries the same UUID and
 * replaces the optimistic copy in useChatSocket via id-based dedupe.
 */
export const useSendMessage = (chatId: string | null) => {
  const queryClient = useQueryClient()
  const { userAddress } = useUserContext()

  return useMutation<ChatMessage, SendMessageError, string, { tempId: string } | undefined>({
    mutationFn: (body: string) => {
      if (!chatId) throw new Error('No chat selected')
      return sendMessage({ chatId, body })
    },
    onMutate: async (body) => {
      if (!chatId) return undefined
      await queryClient.cancelQueries({ queryKey: ['chats', chatId, 'messages'] })

      const tempId = `optimistic-${Date.now()}-${Math.random().toString(36).slice(2)}`
      const optimistic: ChatMessage = {
        id: tempId,
        chat_id: chatId,
        sender_user_id: -1,
        sender_address: userAddress?.toLowerCase(),
        body,
        content_type: 'text',
        metadata: { optimistic: true },
        created_at: new Date().toISOString(),
        edited_at: null,
        deleted_at: null,
      }

      queryClient.setQueryData<InfiniteData<MessagesPage>>(['chats', chatId, 'messages'], (old) => {
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
      if (!chatId) return
      // Defensive fallback: if the server response is missing sender_address
      // (older backend before the JOIN fix), keep the value we set on the
      // optimistic message so the bubble stays on the caller's side.
      const merged: ChatMessage = {
        ...serverMessage,
        sender_address: serverMessage.sender_address ?? userAddress?.toLowerCase(),
      }
      queryClient.setQueryData<InfiniteData<MessagesPage>>(['chats', chatId, 'messages'], (old) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            messages: page.messages.map((m) => (m.id === ctx?.tempId ? merged : m)),
          })),
        }
      })
      // Inbox needs the new last_message + bumped sort.
      queryClient.invalidateQueries({ queryKey: ['chats', 'inbox'] })
    },
    onError: (_err, _body, ctx) => {
      if (!chatId || !ctx) return
      queryClient.setQueryData<InfiniteData<MessagesPage>>(['chats', chatId, 'messages'], (old) => {
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
  })
}
