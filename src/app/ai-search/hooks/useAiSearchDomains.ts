import { fetchDomains } from '@/api/domains/fetchDomains'
import { DEFAULT_FETCH_LIMIT } from '@/constants/api'
import { useUserContext } from '@/context/user'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { useDebounce } from '@/hooks/useDebounce'
import { MarketplaceDomainType } from '@/types/domains'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useAppSelector } from '@/state/hooks'
import { selectAiSearch } from '@/state/reducers/aiSearch/aiSearch'

const TAB_STATUS_MAP: Record<string, string> = {
  registered: 'Registered',
  grace: 'Grace',
  premium: 'Premium',
  available: 'Available',
}

// The /ai/search/semantic endpoint requires a search term of length >= 3.
// See fetchDomains.ts — below that length we silently fall back to /search.
const MIN_SEARCH_LENGTH = 3

export const useAiSearchDomains = () => {
  const { authStatus } = useUserContext()
  const filters = useFilterRouter().selectors.filters
  const { selectedTab } = useAppSelector(selectAiSearch)
  const debouncedSearch = useDebounce(filters.search, 500)

  const forcedStatus = useMemo(() => {
    const status = TAB_STATUS_MAP[selectedTab.value]
    return status ? [status] : []
  }, [selectedTab.value])

  const {
    data: domains,
    isLoading,
    isFetchingNextPage,
    fetchNextPage: fetchMoreDomains,
    hasNextPage: hasMoreDomains,
  } = useInfiniteQuery({
    queryKey: [
      'aiSearch',
      'domains',
      debouncedSearch,
      selectedTab.value,
      filters.length,
      filters.priceRange,
      filters.categories,
      filters.type,
      filters.sort,
      filters.market,
      filters.textMatch,
      filters.textNonMatch,
      filters.offerRange,
      filters.watchersCount,
      filters.viewCount,
      filters.clubsCount,
      filters.creationDate,
    ],
    queryFn: async ({ pageParam = 1 }) => {
      const filtersWithStatus = {
        ...filters,
        status: forcedStatus,
      }

      const result = await fetchDomains({
        limit: DEFAULT_FETCH_LIMIT,
        pageParam,
        // @ts-expect-error filter state type mismatch (status is a string[] at runtime)
        filters: filtersWithStatus,
        searchTerm: debouncedSearch,
        isAuthenticated: authStatus === 'authenticated',
        AISearchEnabled: true,
      })

      return {
        domains: result.domains,
        nextPageParam: result.nextPageParam,
        hasNextPage: result.hasNextPage,
        total: result.total,
      }
    },
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.nextPageParam : undefined),
    initialPageParam: 1,
    enabled: debouncedSearch.trim().length >= MIN_SEARCH_LENGTH,
  })

  const domainsData = useMemo(() => {
    return (
      domains?.pages?.reduce((acc, page) => {
        return [...acc, ...page.domains]
      }, [] as MarketplaceDomainType[]) || []
    )
  }, [domains])

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
