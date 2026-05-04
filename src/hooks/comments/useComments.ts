'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { getComments } from '@/api/comments/getComments'

const PAGE_SIZE = 50

export const useComments = (name: string | null) => {
  const query = useInfiniteQuery({
    queryKey: ['comments', name],
    queryFn: ({ pageParam }) =>
      getComments({
        name: name as string,
        cursor: pageParam ?? undefined,
        limit: PAGE_SIZE,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!name,
    staleTime: 30_000,
  })

  // Pages are newest-first; flatten in order so newest stays at the top.
  const comments = query.data?.pages.flatMap((p) => p.comments) ?? []

  return {
    ...query,
    comments,
  }
}
