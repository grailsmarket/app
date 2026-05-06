'use client'

import { useMemo } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { getMessages } from '@/api/chats/getMessages'
import { useUserContext } from '@/context/user'
import { useChat } from './useChat'
import { useMessagingKeypair } from './useMessagingKeypair'
import { tryDecryptMessage } from '@/lib/crypto'

const PAGE_SIZE = 50

export const useChatMessages = (chatId: string | null) => {
  const { userAddress } = useUserContext()
  const { data: chat } = useChat(chatId)
  const keypair = useMessagingKeypair()

  const query = useInfiniteQuery({
    queryKey: ['chats', chatId, 'messages'],
    queryFn: ({ pageParam }) =>
      getMessages({
        chatId: chatId as string,
        before: pageParam ?? undefined,
        limit: PAGE_SIZE,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!chatId,
    staleTime: 30_000,
  })

  // Pages are newest-first, each page is also newest-first within itself.
  // Flatten and reverse so the consumer renders oldest → newest top-to-bottom.
  // Decryption happens here in a memo so renderers stay dumb and the result
  // recomputes only when keys, participants, or message data change.
  const messages = useMemo(() => {
    const flat = query.data?.pages.flatMap((p) => p.messages) ?? []
    const ordered = [...flat].reverse()
    if (!userAddress) return ordered
    const participants = chat?.participants ?? []
    return ordered.map((m) => tryDecryptMessage(m, userAddress, keypair, participants))
  }, [query.data, userAddress, keypair, chat?.participants])

  return {
    ...query,
    messages,
  }
}
