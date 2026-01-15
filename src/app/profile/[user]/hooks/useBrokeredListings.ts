import { useInfiniteQuery } from '@tanstack/react-query'
import { Address } from 'viem'
import { MarketplaceDomainType } from '@/types/domains'

interface BrokeredListingsResponse {
  success: boolean
  data: {
    results: MarketplaceDomainType[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }
}

interface UseBrokeredListingsOptions {
  status?: 'active' | 'sold' | 'cancelled' | 'expired'
}

export const useBrokeredListings = (brokerAddress: Address | undefined, options: UseBrokeredListingsOptions = {}) => {
  const { status } = options

  const fetchBrokeredListings = async ({
    pageParam = 1,
  }): Promise<{
    domains: MarketplaceDomainType[]
    nextPage: number | null
    total: number
  }> => {
    if (!brokerAddress) {
      return { domains: [], nextPage: null, total: 0 }
    }

    const params = new URLSearchParams({
      page: pageParam.toString(),
      limit: '20',
    })

    if (status) {
      params.set('status', status)
    }

    const response = await fetch(`/api/brokered-listings/broker/${brokerAddress}?${params.toString()}`)

    if (!response.ok) {
      throw new Error('Failed to fetch brokered listings')
    }

    const data: BrokeredListingsResponse = await response.json()

    return {
      domains: data.data.results,
      nextPage: pageParam < data.data.pagination.totalPages ? pageParam + 1 : null,
      total: data.data.pagination.total,
    }
  }

  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ['brokeredListings', brokerAddress, status],
    queryFn: fetchBrokeredListings,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
    enabled: !!brokerAddress,
  })

  const domains = data?.pages?.flatMap((page) => page.domains) ?? []
  const total = data?.pages?.[0]?.total ?? 0

  return {
    brokeredListings: domains,
    totalBrokeredListings: total,
    brokeredListingsLoading: isLoading,
    fetchMoreBrokeredListings: fetchNextPage,
    hasMoreBrokeredListings: !!hasNextPage,
    isFetchingMore: isFetchingNextPage,
  }
}
