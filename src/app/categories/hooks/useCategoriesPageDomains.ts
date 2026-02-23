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
      filters.length,
      filters.priceRange,
      filters.categories,
      filters.type,
      filters.status,
      filters.sort,
      // @ts-expect-error the market filter state will not be used for categories page domains
      filters.market,
      // @ts-expect-error the text match filter state will not be used for categories page domains
      filters.textMatch,
      // @ts-expect-error the text non-match filter state will not be used for categories page domains
      filters.textNonMatch,
      // @ts-expect-error the offer range filter state will not be used for categories page domains
      filters.offerRange,
      // @ts-expect-error the watchers count filter state will not be used for categories page domains
      filters.watchersCount,
      // @ts-expect-error the view count filter state will not be used for categories page domains
      filters.viewCount,
      // @ts-expect-error the clubs count filter state will not be used for categories page domains
      filters.clubsCount,
      // @ts-expect-error the creation date filter state will not be used for categories page domains
      filters.creationDate,
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
        total: domains.total,
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
  const totalDomains = domains?.pages[0]?.total || 0

  return {
    domains: domainsData,
    domainsLoading,
    fetchMoreDomains,
    hasMoreDomains,
    totalDomains,
  }
}
