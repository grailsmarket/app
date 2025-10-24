import { fetchDomains } from '@/api/domains/fetchDomains'
import { DEFAULT_FETCH_LIMIT } from '@/constants/api'
import { useDebounce } from '@/hooks/useDebounce'
import { useAppSelector } from '@/state/hooks'
import { selectMyDomainsFilters } from '@/state/reducers/filters/myDomainsFilters'
import { useInfiniteQuery } from '@tanstack/react-query'

export const useReceivedOffers = () => {
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
      filters.categoryObjects,
      filters.type,
      filters.status,
      filters.sort,
    ],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await fetchDomains({
        limit: DEFAULT_FETCH_LIMIT,
        pageParam,
        filters: filters as any, // TODO: Create separate portfolio API or adapter
        searchTerm: '',
      })

      return response
    },
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.nextPageParam : undefined),
    initialPageParam: 0,
  })

  return {
    receivedOffers,
    isReceivedOffersLoading,
    isReceivedOffersFetchingNextPage,
    fetchMoreReceivedOffers,
    hasMoreReceivedOffers,
  }
}
