'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { getCommentFeed } from '@/api/comments/getFeed'

const PAGE_SIZE = 20

interface UseCommentFeedParams {
  owner?: string
  clubs: string[]
  watchlist?: boolean
  userAddress?: string
  authStatus?: string
  enabled?: boolean
}

export const useCommentFeed = ({
  owner,
  clubs,
  watchlist = false,
  userAddress,
  authStatus,
  enabled = true,
}: UseCommentFeedParams) => {
  const query = useInfiniteQuery({
    queryKey: ['comments', 'feed', owner ?? null, clubs, watchlist, userAddress ?? null, authStatus ?? null],
    queryFn: ({ pageParam }) =>
      getCommentFeed({
        owner,
        clubs,
        watchlist,
        page: pageParam,
        limit: PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined),
    staleTime: 15_000,
    enabled: enabled && (!watchlist || authStatus === 'authenticated'),
  })

  const comments =
    query.data?.pages
      .slice()
      .reverse()
      .flatMap((page) => page.comments.slice().reverse()) ?? []

  return {
    ...query,
    comments,
  }
}
