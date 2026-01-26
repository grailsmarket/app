import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { fetchHolders, Holder } from '@/api/holders'
import { DEFAULT_FETCH_LIMIT } from '@/constants/api'

export const useHolders = (category: string) => {
  return useInfiniteQuery({
    queryKey: ['holders', category],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await fetchHolders({ category, page: pageParam, limit: DEFAULT_FETCH_LIMIT })
      return {
        holders: response.data.holders,
        unique_holders: response.data.unique_holders,
        nextPageParam: response.pagination.page < response.pagination.pages ? response.pagination.page + 1 : undefined,
        hasNextPage: response.pagination.page < response.pagination.pages,
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextPageParam,
    initialPageParam: 1,
    enabled: !!category,
  })
}

export const useHoldersCount = (category: string) => {
  return useQuery({
    queryKey: ['holdersCount', category],
    queryFn: async () => {
      const response = await fetchHolders({ category, page: 1, limit: 1 })
      return response.data.unique_holders
    },
    enabled: !!category,
  })
}

// Flatten holders from infinite query pages
export const flattenHolders = (data: ReturnType<typeof useHolders>['data']): Holder[] => {
  if (!data) return []
  return data.pages.flatMap((page) => page.holders)
}
