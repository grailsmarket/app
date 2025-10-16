import { fetchMarketplaceDomains } from '@/api/domains/fetchMarketplaceDomains'
import { DEFAULT_FETCH_LIMIT } from '@/constants/api'
import { useDebounce } from '@/hooks/useDebounce'
import { useAppSelector } from '@/state/hooks'
import { selectMyDomainsFilters } from '@/state/reducers/filters/myDomainsFilters'
import { PortfolioTabType } from '@/types/filters'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { useState } from 'react'

export const useMyDomains = () => {
  const queryParams = useParams()
  const selectedTab = queryParams.tab as PortfolioTabType
  const defaultSearch = selectedTab === 'domains' ? (queryParams.search as string) || '' : ''
  const [search, setSearch] = useState(defaultSearch)
  const debouncedSearch = useDebounce(search, 500)
  const filters = useAppSelector(selectMyDomainsFilters)

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
        searchTerm: '',
      })

      return response
    },
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.nextPageParam : undefined),
    initialPageParam: 0,
  })

  return {
    search,
    setSearch,
    myDomains,
    isMyDomainsLoading,
    isMyDomainsFetchingNextPage,
    fetchMoreMyDomains,
    hasMoreMyDomains,
  }
}
