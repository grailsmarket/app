'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { getCommentFeed } from '@/api/comments/getFeed'

const PAGE_SIZE = 20

interface UseCommentFeedParams {
  owner?: string
  author?: string
  clubs: string[]
  order?: 'feed' | 'page'
}

export const useCommentFeed = ({ owner, author, clubs, order = 'feed' }: UseCommentFeedParams) => {
  const query = useInfiniteQuery({
    queryKey: ['comments', 'feed', owner ?? null, author ?? null, clubs, order],
    queryFn: ({ pageParam }) =>
      getCommentFeed({
        owner,
        author,
        clubs,
        page: pageParam,
        limit: PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined),
    staleTime: 15_000,
  })

  const comments =
    order === 'feed'
      ? (query.data?.pages
          .slice()
          .reverse()
          .flatMap((page) => page.comments.slice().reverse()) ?? [])
      : (query.data?.pages.flatMap((page) => page.comments) ?? [])

  return {
    ...query,
    comments,
  }
}
