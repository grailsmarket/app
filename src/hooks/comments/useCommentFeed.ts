'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { getCommentFeed } from '@/api/comments/getFeed'

const PAGE_SIZE = 20

interface UseCommentFeedParams {
  owner?: string
  clubs: string[]
}

export const useCommentFeed = ({ owner, clubs }: UseCommentFeedParams) => {
  const query = useInfiniteQuery({
    queryKey: ['comments', 'feed', owner ?? null, clubs],
    queryFn: ({ pageParam }) =>
      getCommentFeed({
        owner,
        clubs,
        page: pageParam,
        limit: PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined),
    staleTime: 15_000,
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
