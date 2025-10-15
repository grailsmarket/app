import { fetchMarketplaceDomains } from '@/api/domains/fetchMarketplaceDomains'
import { DEFAULT_FETCH_LIMIT } from '@/constants/api'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { useDebounce } from '@/hooks/useDebounce'
import { MarketplaceDomainType } from '@/types/domains'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

export const useDomains = () => {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 500)
  const { selectors } = useFilterRouter()
  const { filters } = selectors

  const {
    data: domains,
    isLoading,
    isFetchingNextPage,
    fetchNextPage: fetchMoreDomains,
    hasNextPage: hasMoreDomains,
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
      const domains = await fetchMarketplaceDomains({
        limit: DEFAULT_FETCH_LIMIT,
        pageParam,
        filters: filters as any, // TODO: Create separate portfolio API or adapter
        searchTerm: debouncedSearch,
      })

      return {
        domains: domains.domains,
        nextPageParam: domains.nextPageParam,
        hasNextPage: domains.hasNextPage,
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextPageParam,
    initialPageParam: 0,
  })

  const domainsData = useMemo(() => {
    return (
      domains?.pages?.reduce((acc, page) => {
        return [...acc, ...page.domains]
      }, [] as MarketplaceDomainType[]) || []
    )
  }, [domains])
  const domainsLoading = isLoading || isFetchingNextPage

  return {
    domains: domainsData,
    domainsLoading,
    fetchMoreDomains,
    hasMoreDomains,
    search,
    setSearch,
  }
}
