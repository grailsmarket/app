import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchBatchFollowState, useTransactions } from 'ethereum-identity-kit'
import { useEffect, useMemo } from 'react'

interface UseBatchButtonStateQueryProps {
  addresses: string[][]
  queryKey: any[]
}

export const useBatchButtonStateQuery = ({ addresses, queryKey }: UseBatchButtonStateQueryProps) => {
  const { selectedList, isCheckoutFinished } = useTransactions()

  // used to determine the first page and help with finding out if the query needs to be refetched
  const firstPageKey = addresses[0]?.join(',') ?? ''

  const {
    data: followStatesData,
    isLoading: isFollowStatesLoading,
    isFetchingNextPage: isFetchingNextFollowStatesPage,
    fetchNextPage: fetchNextFollowStatesPage,
    refetch: refetchFollowStates,
    isRefetching: isRefetchingFollowStates,
  } = useInfiniteQuery({
    queryKey: [...queryKey, selectedList, firstPageKey],
    queryFn: async ({ pageParam = 1 }) => {
      const addressesToFetch = addresses[pageParam - 1]

      if (!addressesToFetch || addressesToFetch.length === 0) {
        return {
          followStates: [],
          nextPageParam: pageParam,
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
    enabled: addresses.length > 0 && addresses[0]?.length > 0,
  })

  useEffect(() => {
    const pagesLoaded = followStatesData?.pages?.length ?? 0
    if (pagesLoaded > 0 && addresses.length > pagesLoaded) {
      fetchNextFollowStatesPage()
    }
  }, [addresses.length, followStatesData?.pages?.length, fetchNextFollowStatesPage])

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
