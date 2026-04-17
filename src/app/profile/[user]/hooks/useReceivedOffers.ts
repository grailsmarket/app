import { Address } from 'viem'
import fetchReceivedOffers from '@/api/offers/received'
import { DEFAULT_FETCH_LIMIT } from '@/constants/api'
import { useDebounce } from '@/hooks/useDebounce'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'

export const useReceivedOffers = (user: Address | undefined) => {
  const {
    selectors: { filters },
  } = useFilterRouter()
  const debouncedSearch = useDebounce(filters.search, 500)

  const {
    data: receivedOffers,
    isLoading: isReceivedOffersLoading,
    isFetchingNextPage: isReceivedOffersFetchingNextPage,
    fetchNextPage: fetchMoreReceivedOffers,
    hasNextPage: hasMoreReceivedOffers,
  } = useInfiniteQuery({
    queryKey: [
      'profile',
      'received_offers',
      user,
      debouncedSearch,
      filters.length,
      filters.priceRange,
      filters.type,
      filters.status,
      filters.sort,
      filters.length,
      filters.textMatch,
      filters.market,
    ],
    queryFn: async ({ pageParam = 1 }) => {
      if (!user)
        return {
          offers: [],
          total: 0,
          nextPageParam: pageParam,
          hasNextPage: false,
        }

      const response = await fetchReceivedOffers({
        limit: DEFAULT_FETCH_LIMIT,
        pageParam,
        filters,
        searchTerm: debouncedSearch,
        ownerAddress: user,
      })

      return {
        offers: response.offers,
        total: response.total,
        nextPageParam: response.nextPageParam,
        hasNextPage: response.hasNextPage,
      }
    },
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.nextPageParam : undefined),
    initialPageParam: 1,
    enabled: !!user,
  })

  const totalReceivedOffers = receivedOffers?.pages[0]?.total || 0

  return {
    receivedOffers,
    isReceivedOffersLoading,
    isReceivedOffersFetchingNextPage,
    fetchMoreReceivedOffers,
    hasMoreReceivedOffers,
    totalReceivedOffers,
  }
}
