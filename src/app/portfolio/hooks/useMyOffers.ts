import fetchMyOffers from '@/api/offers/sent'
import { DEFAULT_FETCH_LIMIT } from '@/constants/api'
import { useDebounce } from '@/hooks/useDebounce'
import { useAppSelector } from '@/state/hooks'
import { selectMyDomainsFilters } from '@/state/reducers/filters/myDomainsFilters'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useUserContext } from '@/context/user'

export const useMyOffers = () => {
  const { userAddress, authStatus } = useUserContext()
  const filters = useAppSelector(selectMyDomainsFilters)
  const debouncedSearch = useDebounce(filters.search, 500)

  const {
    data: myOffers,
    isLoading: isMyOffersLoading,
    isFetchingNextPage: isMyOffersFetchingNextPage,
    fetchNextPage: fetchMoreMyOffers,
    hasNextPage: hasMoreMyOffers,
  } = useInfiniteQuery({
    queryKey: [
      'portfolio',
      'my_offers',
      userAddress,
      debouncedSearch,
      filters.length,
      filters.priceRange,
      filters.length,
      filters.type,
      filters.status,
      filters.sort,
    ],
    queryFn: async ({ pageParam = 1 }) => {
      if (!userAddress)
        return {
          offers: [],
          nextPageParam: pageParam,
          hasNextPage: false,
        }

      const response = await fetchMyOffers({
        limit: DEFAULT_FETCH_LIMIT,
        pageParam,
        filters,
        ownerAddress: userAddress,
        searchTerm: debouncedSearch,
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
    myOffers,
    isMyOffersLoading,
    isMyOffersFetchingNextPage,
    fetchMoreMyOffers,
    hasMoreMyOffers,
  }
}
