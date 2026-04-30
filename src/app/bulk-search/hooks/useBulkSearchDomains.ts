import { fetchDomains } from '@/api/domains/fetchDomains'
import { DEFAULT_FETCH_LIMIT } from '@/constants/api'
import { useUserContext } from '@/context/user'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { MarketplaceDomainType } from '@/types/domains'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useAppSelector } from '@/state/hooks'
import { selectBulkSearch } from '@/state/reducers/bulkSearch/bulkSearch'

export const useBulkSearchDomains = () => {
  const { authStatus } = useUserContext()
  const filters = useFilterRouter().selectors.filters
  const { searchTerms, selectedTab } = useAppSelector(selectBulkSearch)

  // Force status based on active tab
  const forcedStatus = useMemo(() => {
    const tabValue = selectedTab.value
    if (tabValue === 'names') return []
    // Map tab value to status filter format
    const statusMap: Record<string, string> = {
      registered: 'Registered',
      grace: 'Grace',
      premium: 'Premium',
      available: 'Available',
    }
    return statusMap[tabValue] ? [statusMap[tabValue]] : []
  }, [selectedTab.value])

  const {
    data: domains,
    isLoading,
    isFetchingNextPage,
    fetchNextPage: fetchMoreDomains,
    hasNextPage: hasMoreDomains,
  } = useInfiniteQuery({
    queryKey: [
      'bulkSearch',
      'domains',
      searchTerms,
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
        // @ts-expect-error filter state type mismatch
        filters: filtersWithStatus,
        searchTerm: searchTerms,
        enableBulkSearch: true,
        isAuthenticated: authStatus === 'authenticated',
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
    enabled: !!searchTerms,
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
