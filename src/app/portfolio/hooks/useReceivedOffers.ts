import fetchReceivedOffers from '@/api/offers/received'
import { DEFAULT_FETCH_LIMIT } from '@/constants/api'
import { useDebounce } from '@/hooks/useDebounce'
import { useAppSelector } from '@/state/hooks'
import { selectMyDomainsFilters } from '@/state/reducers/filters/myDomainsFilters'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useAccount } from 'wagmi'

export const useReceivedOffers = () => {
  const { address: userAddress } = useAccount()
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
      debouncedSearch,
      filters.length,
      filters.priceRange,
      filters.type,
      filters.status,
      filters.sort,
      filters.length,
    ],
    queryFn: async ({ pageParam = 0 }) => {
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
    initialPageParam: 0,
    enabled: !!userAddress,
  })

  return {
    receivedOffers,
    isReceivedOffersLoading,
    isReceivedOffersFetchingNextPage,
    fetchMoreReceivedOffers,
    hasMoreReceivedOffers,
  }
}
