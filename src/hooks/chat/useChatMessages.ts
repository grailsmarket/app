'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { getMessages } from '@/api/chats/getMessages'

const PAGE_SIZE = 50

export const useChatMessages = (chatId: string | null) => {
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
  const flat = query.data?.pages.flatMap((p) => p.messages) ?? []
  const messages = [...flat].reverse()

  return {
    ...query,
    messages,
  }
}
