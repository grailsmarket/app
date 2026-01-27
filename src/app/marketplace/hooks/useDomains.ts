import { fetchDomains } from '@/api/domains/fetchDomains'
import { DEFAULT_FETCH_LIMIT } from '@/constants/api'
import { useUserContext } from '@/context/user'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { useDebounce } from '@/hooks/useDebounce'
import { MarketplaceDomainType } from '@/types/domains'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

export const useDomains = () => {
  const { authStatus } = useUserContext()
  const filters = useFilterRouter().selectors.filters
  const debouncedSearch = useDebounce(filters.search, 500)

  const {
    data: domains,
    isLoading,
    isFetchingNextPage,
    fetchNextPage: fetchMoreDomains,
    hasNextPage: hasMoreDomains,
  } = useInfiniteQuery({
    queryKey: [
      'marketplace',
      'domains',
      debouncedSearch,
      filters.length,
      filters.priceRange,
      filters.categories,
      filters.type,
      filters.status,
      filters.sort,
      // @ts-expect-error the text match filter state will not be used for domains
      filters.market,
      // @ts-expect-error the text match filter state will not be used for domains
      filters.textMatch,
      // @ts-expect-error the text non-match filter state will not be used for domains
      filters.textNonMatch,
      // @ts-expect-error the offer range filter state will not be used for domains
      filters.offerRange,
    ],
    queryFn: async ({ pageParam = 1 }) => {
      const domains = await fetchDomains({
        limit: DEFAULT_FETCH_LIMIT,
        pageParam,
        // @ts-expect-error the filters state will not be used for domains
        filters,
        searchTerm: debouncedSearch,
        enableBulkSearch: true,
        isAuthenticated: authStatus === 'authenticated',
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
  })

  const domainsData = useMemo(() => {
    return (
      domains?.pages?.reduce((acc, page) => {
        return [...acc, ...page.domains]
      }, [] as MarketplaceDomainType[]) || []
    )
  }, [domains])

  // Get total count from first page of data
  const total = useMemo(() => {
    return domains?.pages?.[0]?.total || 0
  }, [domains])

  const domainsLoading = isLoading || isFetchingNextPage

  return {
    domains: domainsData,
    domainsLoading,
    fetchMoreDomains,
    hasMoreDomains,
    total,
  }
}
