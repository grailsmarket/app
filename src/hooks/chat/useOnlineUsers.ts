'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { getOnlineUsers } from '@/api/globalChat/getOnlineUsers'

const PAGE_SIZE = 20

/** Users signed in within the last 24h. Polls every 60s while `enabled`. */
export const useOnlineUsers = (enabled: boolean) => {
  const query = useInfiniteQuery({
    queryKey: ['users', 'online'],
    queryFn: ({ pageParam = 1 }) => getOnlineUsers({ page: pageParam, limit: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined),
    enabled,
    staleTime: 30_000,
    refetchInterval: enabled ? 60_000 : false,
  })

  const users = query.data?.pages.flatMap((p) => p.users) ?? []
  const total = query.data?.pages[0]?.pagination.total ?? 0

  return {
    ...query,
    users,
    total,
  }
}
