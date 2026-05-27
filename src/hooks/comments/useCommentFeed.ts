'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { getCommentFeed } from '@/api/comments/getFeed'

const PAGE_SIZE = 20

interface UseCommentFeedParams {
  owner?: string
  clubs: string[]
  watchlist?: boolean
  enabled?: boolean
}

export const useCommentFeed = ({ owner, clubs, watchlist = false, enabled = true }: UseCommentFeedParams) => {
  const query = useInfiniteQuery({
    queryKey: ['comments', 'feed', owner ?? null, clubs, watchlist],
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
    enabled,
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
