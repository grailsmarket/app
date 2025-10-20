import { fetchMarketplaceDomains } from '@/api/domains/fetchMarketplaceDomains'
import { DEFAULT_FETCH_LIMIT } from '@/constants/api'
import { useDebounce } from '@/hooks/useDebounce'
import { useAppSelector } from '@/state/hooks'
import { selectMyDomainsFilters } from '@/state/reducers/filters/myDomainsFilters'
import { useInfiniteQuery } from '@tanstack/react-query'

export const useMyDomains = () => {
  const filters = useAppSelector(selectMyDomainsFilters)
  const debouncedSearch = useDebounce(filters.search, 500)

  const {
    data: myDomains,
    isLoading: isMyDomainsLoading,
    isFetchingNextPage: isMyDomainsFetchingNextPage,
    fetchNextPage: fetchMoreMyDomains,
    hasNextPage: hasMoreMyDomains,
  } = useInfiniteQuery({
    queryKey: [
      'portfolio',
      'domains',
      debouncedSearch,
      filters.length,
      filters.priceRange,
      filters.categoryObjects,
      filters.type,
      filters.status,
      filters.sort,
    ],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await fetchMarketplaceDomains({
        limit: DEFAULT_FETCH_LIMIT,
        pageParam,
        filters: filters as any, // TODO: Create separate portfolio API or adapter
        searchTerm: debouncedSearch,
      })

      return response
    },
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.nextPageParam : undefined),
    initialPageParam: 0,
  })

  return {
    myDomains,
    isMyDomainsLoading,
    isMyDomainsFetchingNextPage,
    fetchMoreMyDomains,
    hasMoreMyDomains,
  }
}
