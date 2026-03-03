import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchBatchFollowState, useTransactions } from 'ethereum-identity-kit'
import { useEffect, useMemo } from 'react'

interface UseBatchButtonStateQueryProps {
  addresses: string[][]
  queryKey: string[]
}

export const useBatchButtonStateQuery = ({ addresses, queryKey }: UseBatchButtonStateQueryProps) => {
  const { selectedList, isCheckoutFinished } = useTransactions()

  const {
    data: followStatesData,
    isLoading: isFollowStatesLoading,
    isFetchingNextPage: isFetchingNextFollowStatesPage,
    fetchNextPage: fetchNextFollowStatesPage,
    refetch: refetchFollowStates,
    isRefetching: isRefetchingFollowStates,
  } = useInfiniteQuery({
    queryKey: [...queryKey, selectedList],
    queryFn: async ({ pageParam = 1 }) => {
      const addressesToFetch = addresses[pageParam - 1] || []
      if (addressesToFetch.length === 0) {
        return {
          followStates: [],
          nextPageParam: pageParam + 1,
          hasNextPage: true,
        }
      }
      const response = await fetchBatchFollowState({
        lookupAddressesOrNames: addressesToFetch,
        list: selectedList,
      })
      return {
        followStates: response,
        nextPageParam: pageParam + 1,
        hasNextPage: true,
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextPageParam,
    initialPageParam: 1,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    fetchNextFollowStatesPage()
  }, [addresses, fetchNextFollowStatesPage])

  useEffect(() => {
    if (isCheckoutFinished) {
      refetchFollowStates()
    }
  }, [isCheckoutFinished, refetchFollowStates])

  const followStates = useMemo(() => {
    return followStatesData?.pages.flatMap((page) => page.followStates) || []
  }, [followStatesData])

  return {
    followStates,
    isFollowStatesLoading,
    isFetchingNextFollowStatesPage,
    fetchNextFollowStatesPage,
    refetchFollowStates,
    isRefetchingFollowStates,
  }
}
