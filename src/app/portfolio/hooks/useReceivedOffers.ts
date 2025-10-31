import fetchReceivedOffers from '@/api/offers/received'
import { DEFAULT_FETCH_LIMIT } from '@/constants/api'
import { useAuth } from '@/hooks/useAuthStatus'
import { useDebounce } from '@/hooks/useDebounce'
import { useAppSelector } from '@/state/hooks'
import { selectMyDomainsFilters } from '@/state/reducers/filters/myDomainsFilters'
import { useInfiniteQuery } from '@tanstack/react-query'

export const useReceivedOffers = () => {
  const { address: userAddress, authStatus } = useAuth()
  const filters = useAppSelector(selectMyDomainsFilters)
  const debouncedSearch = useDebounce(filters.search, 500)

  const {
    data: receivedOffers,
    isLoading: isReceivedOffersLoading,
    isFetchingNextPage: isReceivedOffersFetchingNextPage,
    fetchNextPage: fetchMoreReceivedOffers,
    hasNextPage: hasMoreReceivedOffers,
  } = useInfiniteQuery({
    queryKey: [
      'portfolio',
      'received_offers',
      userAddress,
      debouncedSearch,
      filters.length,
      filters.priceRange,
      filters.type,
      filters.status,
      filters.sort,
      filters.length,
    ],
    queryFn: async ({ pageParam = 1 }) => {
      if (!userAddress)
        return {
          offers: [],
          nextPageParam: pageParam,
          hasNextPage: false,
        }

      const response = await fetchReceivedOffers({
        limit: DEFAULT_FETCH_LIMIT,
        pageParam,
        filters,
        searchTerm: debouncedSearch,
        ownerAddress: userAddress,
      })

      return {
        offers: response.offers,
        nextPageParam: response.nextPageParam,
        hasNextPage: response.hasNextPage,
      }
    },
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.nextPageParam : undefined),
    initialPageParam: 1,
    enabled: !!userAddress && authStatus === 'authenticated',
  })

  return {
    receivedOffers,
    isReceivedOffersLoading,
    isReceivedOffersFetchingNextPage,
    fetchMoreReceivedOffers,
    hasMoreReceivedOffers,
  }
}
