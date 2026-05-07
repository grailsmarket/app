'use client'

import { useRef } from 'react'
import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { sendMessage, type SendMessageError } from '@/api/chats/sendMessage'
import type { ChatMessage, ChatMessagesResponse } from '@/types/chat'
import { useUserContext } from '@/context/user'
import { sessionRegistry } from '@/lib/e2e/sessionRegistry'
import { plaintextCache } from '@/lib/e2e/plaintextCache'

interface MessagesPage extends ChatMessagesResponse {}

/**
 * Optimistically appends the message to the messages cache and rolls back on failure.
 * The canonical server-broadcast `chat:message_new` event carries the same UUID and
 * replaces the optimistic copy in useChatSocket via id-based dedupe.
 *
 * When E2E is ready for this chat (session registered via E2EHandshakeBanner →
 * useE2ESession), the body is encrypted and wrapped in the body-encoded JSON
 * envelope before posting; the optimistic row keeps plaintext for instant UI.
 * The tempId is embedded in the envelope as `mid` so the WS handler can dedup
 * the self-echo without depending on body match (ciphertext won't match plaintext).
 */
export const useSendMessage = (chatId: string | null) => {
  const queryClient = useQueryClient()
  const { userAddress } = useUserContext()
  const pendingMidsRef = useRef<Map<string, string>>(new Map())

  return useMutation<ChatMessage, SendMessageError, string, { tempId: string } | undefined>({
    mutationFn: async (body: string) => {
      if (!chatId) throw new Error('No chat selected')
      const tempId = pendingMidsRef.current.get(body)
      pendingMidsRef.current.delete(body)
      const session = sessionRegistry.get(chatId)
      if (session?.isReady() && tempId) {
        const encodedBody = await session.encrypt(body, tempId)
        const sent = await sendMessage({ chatId, body: encodedBody })
        plaintextCache.set(sent.id, body)
        return sent
      }
      return sendMessage({ chatId, body })
    },
    onMutate: async (body) => {
      if (!chatId) return undefined
      await queryClient.cancelQueries({ queryKey: ['chats', chatId, 'messages'] })

      const tempId = `optimistic-${Date.now()}-${Math.random().toString(36).slice(2)}`
      pendingMidsRef.current.set(body, tempId)
      plaintextCache.set(tempId, body)

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
      if (ctx?.tempId) plaintextCache.rename(ctx.tempId, serverMessage.id)
      // Defensive fallback: if the server response is missing sender_address
      // (older backend before the JOIN fix), keep the value we set on the
      // optimistic message so the bubble stays on the caller's side.
      const merged: ChatMessage = {
        ...serverMessage,
        sender_address: serverMessage.sender_address ?? userAddress?.toLowerCase(),
      }
      queryClient.setQueryData<InfiniteData<MessagesPage>>(['chats', chatId, 'messages'], (old) => {
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
      // Inbox needs the new last_message + bumped sort.
      queryClient.invalidateQueries({ queryKey: ['chats', 'inbox'] })
    },
    onError: (_err, body, ctx) => {
      pendingMidsRef.current.delete(body)
      if (ctx?.tempId) plaintextCache.delete(ctx.tempId)
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
