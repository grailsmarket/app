import { fetchDomains } from '@/api/domains/fetchDomains'
import { DEFAULT_FETCH_LIMIT } from '@/constants/api'
import { useUserContext } from '@/context/user'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { useDebounce } from '@/hooks/useDebounce'
import { MarketplaceDomainType } from '@/types/domains'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

export const useCategoriesPageDomains = () => {
  const { authStatus } = useUserContext()
  const { selectors, categoriesPageTab } = useFilterRouter()
  const filters = selectors.filters
  const debouncedSearch = useDebounce(filters.search, 500)

  // Only fetch domains for domain tabs (names, premium, available), not categories tab
  const isDomainTab =
    categoriesPageTab?.value === 'names' ||
    categoriesPageTab?.value === 'listings' ||
    categoriesPageTab?.value === 'premium' ||
    categoriesPageTab?.value === 'available'

  const {
    data: domains,
    isLoading,
    isFetchingNextPage,
    fetchNextPage: fetchMoreDomains,
    hasNextPage: hasMoreDomains,
  } = useInfiniteQuery({
    queryKey: [
      'categoriesPage',
      'domains',
      categoriesPageTab?.value,
      debouncedSearch,
      (filters as any).length,
      (filters as any).priceRange,
      (filters as any).categories,
      (filters as any).type,
      (filters as any).status,
      (filters as any).sort,
      (filters as any).market,
      (filters as any).textMatch,
      (filters as any).textNonMatch,
      (filters as any).offerRange,
    ],
    queryFn: async ({ pageParam = 1 }) => {
      const domains = await fetchDomains({
        limit: DEFAULT_FETCH_LIMIT,
        pageParam,
        // @ts-expect-error the filters state type varies by tab
        filters,
        searchTerm: debouncedSearch,
        enableBulkSearch: true,
        isAuthenticated: authStatus === 'authenticated',
        // For all domain tabs on categories page, filter to only domains in a category
        inAnyCategory: true,
      })

      return {
        domains: domains.domains,
        nextPageParam: domains.nextPageParam,
        hasNextPage: domains.hasNextPage,
      }
    },
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.nextPageParam : undefined),
    initialPageParam: 1,
    enabled: isDomainTab,
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
  }
}
