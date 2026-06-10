import { useInfiniteQuery } from '@tanstack/react-query'
import { getFeed } from '@/api/activity/feed'

export const useComments = (category: string) => {
  return useInfiniteQuery({
    queryKey: ['category-comments', category],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await getFeed({
        kinds: ['comment'],
        clubs: [category],
        page: pageParam,
        limit: 20,
        priceRange: {},
      })
      return response.data
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.hasNext) {
        return lastPage.pagination.page + 1
      }
      return undefined
    },
  })
}
