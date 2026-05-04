'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { getChats } from '@/api/chats/getChats'
import { useUserContext } from '@/context/user'

const INBOX_PAGE_SIZE = 20

export const useChatsInbox = () => {
  const { userAddress, authStatus } = useUserContext()

  const query = useInfiniteQuery({
    queryKey: ['chats', 'inbox'],
    queryFn: ({ pageParam = 1 }) => getChats({ page: pageParam, limit: INBOX_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined),
    enabled: !!userAddress && authStatus === 'authenticated',
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  })

  const chats = query.data?.pages.flatMap((p) => p.chats) ?? []
  const totalUnread = chats.reduce((sum, c) => sum + (c.unread_count ?? 0), 0)

  return {
    ...query,
    chats,
    totalUnread,
  }
}

/** Standalone hook for the icon badge: same query key as the inbox so the cache is shared. */
export const useChatsUnreadTotal = () => {
  const { chats } = useChatsInbox()
  return chats.reduce((sum, c) => sum + (c.unread_count ?? 0), 0)
}
