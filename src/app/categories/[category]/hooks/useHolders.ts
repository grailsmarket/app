import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { fetchHolders } from '@/api/holders'
import { DEFAULT_FETCH_LIMIT } from '@/constants/api'
import { useMemo } from 'react'
import { useBatchButtonStateQuery } from '@/hooks/useBatchButtonStateQuery'

export const useHolders = (category: string) => {
  const {
    data: holdersData,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
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

  const { followStates, isFollowStatesLoading, isFetchingNextFollowStatesPage, isRefetchingFollowStates } =
    useBatchButtonStateQuery({
      addresses: holdersData?.pages.map((page) => page.holders.map((holder) => holder.address)) || [],
      queryKey: ['followStates', category, 'holders'],
    })

  const holders = useMemo(() => {
    return holdersData?.pages.flatMap((page) => page.holders) || []
  }, [holdersData])

  const holdersWithFollowStates = useMemo(() => {
    return holders.map((holder, index) => {
      const followState = followStates?.[index]
      return {
        ...holder,
        followState: {
          state: followState?.state,
          isLoading: followState
            ? isRefetchingFollowStates
            : isFollowStatesLoading || isFetchingNextFollowStatesPage || isRefetchingFollowStates,
        },
      }
    })
  }, [holders, followStates, isFollowStatesLoading, isFetchingNextFollowStatesPage, isRefetchingFollowStates])

  return {
    holders: holdersWithFollowStates,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  }
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
