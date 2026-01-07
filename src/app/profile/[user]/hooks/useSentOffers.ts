import fetchSentOffers from '@/api/offers/sent'
import { DEFAULT_FETCH_LIMIT } from '@/constants/api'
import { useDebounce } from '@/hooks/useDebounce'
import { useAppSelector } from '@/state/hooks'
import { selectMyDomainsFilters } from '@/state/reducers/filters/myDomainsFilters'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Address } from 'viem'

export const useSentOffers = (user: Address | undefined) => {
  const filters = useAppSelector(selectMyDomainsFilters)
  const debouncedSearch = useDebounce(filters.search, 500)

  const {
    data: sentOffers,
    isLoading: isSentOffersLoading,
    isFetchingNextPage: isSentOffersFetchingNextPage,
    fetchNextPage: fetchMoreSentOffers,
    hasNextPage: hasMoreSentOffers,
  } = useInfiniteQuery({
    queryKey: [
      'profile',
      'sent_offers',
      user,
      debouncedSearch,
      filters.length,
      filters.priceRange,
      filters.length,
      filters.type,
      filters.status,
      filters.sort,
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

      const response = await fetchSentOffers({
        limit: DEFAULT_FETCH_LIMIT,
        pageParam,
        filters,
        ownerAddress: user,
        searchTerm: debouncedSearch,
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

  const totalSentOffers = sentOffers?.pages[0]?.total || 0

  return {
    sentOffers,
    isSentOffersLoading,
    isSentOffersFetchingNextPage,
    fetchMoreSentOffers,
    hasMoreSentOffers,
    totalSentOffers,
  }
}
