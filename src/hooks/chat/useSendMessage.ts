'use client'

import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { sendMessage, type SendMessageError } from '@/api/chats/sendMessage'
import type { Chat, ChatMessage, ChatMessagesResponse } from '@/types/chat'
import { useUserContext } from '@/context/user'
import {
  encryptForPeerParticipant,
  findPeer,
  isEncryptedBody,
  publicKeyFromBase64,
  decryptFromPeer,
} from '@/lib/crypto'
import { getCurrentMessagingKeypair } from './messagingKeysSingleton'

interface MessagesPage extends ChatMessagesResponse {}

/**
 * Optimistically appends the message to the messages cache and rolls back on
 * failure. The canonical server-broadcast `chat:message_new` event carries the
 * same UUID and replaces the optimistic copy in useChatSocket via id-based
 * dedupe.
 *
 * Encryption: the body is encrypted to the peer's published X25519 pubkey
 * before POST, and the optimistic cache entry retains the plaintext via
 * `decrypted_body` so the local UI shows the message immediately.
 */
export const useSendMessage = (chatId: string | null) => {
  const queryClient = useQueryClient()
  const { userAddress } = useUserContext()

  return useMutation<ChatMessage, SendMessageError, string, { tempId: string; plaintext: string } | undefined>({
    mutationFn: async (body: string) => {
      if (!chatId) throw new Error('No chat selected')
      if (!userAddress) throw new Error('Not authenticated')

      const chat = queryClient.getQueryData<Chat>(['chats', chatId, 'detail'])
      const peer = chat?.participants ? findPeer(chat.participants, userAddress) : null
      const myKeypair = getCurrentMessagingKeypair()

      // Without both keys we can't encrypt; refuse rather than silently fall
      // back to plaintext (which would leak the message body to the server).
      if (!myKeypair) {
        const err: SendMessageError = {
          status: 0,
          code: 'ENCRYPTION_KEY_MISSING',
          message: 'Set up your messaging keys before sending.',
        }
        throw err
      }
      if (!peer) {
        const err: SendMessageError = {
          status: 0,
          code: 'PEER_MISSING',
          message: 'Could not find the recipient for this chat.',
        }
        throw err
      }

      let encrypted: string
      try {
        encrypted = await encryptForPeerParticipant(body, myKeypair, peer)
      } catch (e) {
        const err: SendMessageError = {
          status: 0,
          code: 'PEER_KEY_UNAVAILABLE',
          message: e instanceof Error && e.message ? e.message : 'Recipient has not enabled encrypted messaging yet.',
        }
        throw err
      }

      return sendMessage({ chatId, body: encrypted })
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
        // Body is plaintext on the optimistic placeholder — the WS-side
        // dedupe compares `decrypted_body ?? body`, so this matches the
        // canonical message after we decrypt it on receive.
        body,
        decrypted_body: body,
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

      return { tempId, plaintext: body }
    },
    onSuccess: (serverMessage, _body, ctx) => {
      if (!chatId) return
      // The server returns the encrypted body. Decrypt it locally so the
      // canonical record we cache also carries plaintext for rendering.
      const myKeypair = getCurrentMessagingKeypair()
      const chat = queryClient.getQueryData<Chat>(['chats', chatId, 'detail'])
      const peer = chat?.participants && userAddress ? findPeer(chat.participants, userAddress) : null

      let decryptedBody: string | null = ctx?.plaintext ?? null
      if (serverMessage.body && isEncryptedBody(serverMessage.body) && myKeypair && peer?.public_encryption_key) {
        try {
          const peerPub = publicKeyFromBase64(peer.public_encryption_key)
          decryptedBody = decryptFromPeer(serverMessage.body, myKeypair.secretKey, peerPub)
        } catch {
          // Fall back to the optimistic plaintext we just sent.
        }
      }

      const merged: ChatMessage = {
        ...serverMessage,
        sender_address: serverMessage.sender_address ?? userAddress?.toLowerCase(),
        decrypted_body: decryptedBody,
      }
      queryClient.setQueryData<InfiniteData<MessagesPage>>(['chats', chatId, 'messages'], (old) => {
        if (!old) return old
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
            messages: page.messages.map((m) => m).filter((m) => m.id !== ctx.tempId),
          })),
        }
      })
    },
  })
}
