import { useMemo } from 'react'
import { fetchAllHolders } from '@/api/holders'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useBatchButtonStateQuery } from '@/hooks/useBatchButtonStateQuery'

const DEFAULT_LIMIT = 20

export const useAllHolders = () => {
  const {
    data: holdersData,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
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

  const addresses = useMemo(() => {
    return holdersData?.pages.map((page) => page.holders.map((holder) => holder.address)) || []
  }, [holdersData])

  const { followStates, isFollowStatesLoading, isFetchingNextFollowStatesPage, isRefetchingFollowStates } =
    useBatchButtonStateQuery({
      addresses: addresses,
      queryKey: ['followStates', 'all-holders'],
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

export const useAllHoldersCount = () => {
  return useQuery({
    queryKey: ['allHoldersCount'],
    queryFn: async () => {
      const response = await fetchAllHolders({ page: 1, limit: 1 })
      return response.data.unique_holders
    },
  })
}
