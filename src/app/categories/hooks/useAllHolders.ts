import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { fetchAllHolders, Holder } from '@/api/holders'

const DEFAULT_LIMIT = 20

export const useAllHolders = () => {
  return useInfiniteQuery({
    queryKey: ['allHolders'],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await fetchAllHolders({ page: pageParam, limit: DEFAULT_LIMIT })
      return {
        holders: response.data.holders,
        unique_holders: response.data.unique_holders,
        nextPageParam: response.pagination.page < response.pagination.pages ? response.pagination.page + 1 : undefined,
        hasNextPage: response.pagination.page < response.pagination.pages,
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextPageParam,
    initialPageParam: 1,
  })
}

export const useAllHoldersCount = () => {
  return useQuery({
    queryKey: ['allHoldersCount'],
    queryFn: async () => {
      const response = await fetchAllHolders({ page: 1, limit: 1 })
      return response.data.unique_holders
    },
  })
}

// Flatten holders from infinite query pages
export const flattenAllHolders = (data: ReturnType<typeof useAllHolders>['data']): Holder[] => {
  if (!data) return []
  return data.pages.flatMap((page) => page.holders)
}
