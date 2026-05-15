import { fetchDomains } from '@/api/domains/fetchDomains'
import { useUserContext } from '@/context/user'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { useQuery } from '@tanstack/react-query'
import { useAppSelector } from '@/state/hooks'
import { selectBulkSearch } from '@/state/reducers/bulkSearch/bulkSearch'

// const STATUS_TABS = [
//   { key: 'names', status: [] },
//   { key: 'registered', status: ['Registered'] },
//   { key: 'grace', status: ['Grace'] },
//   { key: 'premium', status: ['Premium'] },
//   { key: 'available', status: ['Available'] },
// ] as const

function useBulkSearchCount(tabKey: string, forcedStatus: string[], activeTabValue?: string, activeTabTotal?: number) {
  const { authStatus } = useUserContext()
  const filters = useFilterRouter().selectors.filters
  const { searchTerms } = useAppSelector(selectBulkSearch)
  const hasActiveTabTotal = activeTabValue === tabKey && activeTabTotal !== undefined

  const { data } = useQuery({
    queryKey: [
      'bulkSearch',
      'count',
      tabKey,
      searchTerms,
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
    queryFn: async () => {
      const filtersWithStatus = {
        ...filters,
        status: forcedStatus,
      }

      const result = await fetchDomains({
        limit: 1,
        pageParam: 1,
        // @ts-expect-error filter state type mismatch
        filters: filtersWithStatus,
        searchTerm: searchTerms,
        enableBulkSearch: true,
        isAuthenticated: authStatus === 'authenticated',
      })

      return result.total || 0
    },
    enabled: !!searchTerms && !hasActiveTabTotal,
  })

  return hasActiveTabTotal ? activeTabTotal : data
}

export function useBulkSearchCounts(activeTabValue?: string, activeTabTotal?: number) {
  const namesCount = useBulkSearchCount('names', [], activeTabValue, activeTabTotal)
  const registeredCount = useBulkSearchCount('registered', ['Registered'], activeTabValue, activeTabTotal)
  const graceCount = useBulkSearchCount('grace', ['Grace'], activeTabValue, activeTabTotal)
  const premiumCount = useBulkSearchCount('premium', ['Premium'], activeTabValue, activeTabTotal)
  const availableCount = useBulkSearchCount('available', ['Available'], activeTabValue, activeTabTotal)

  return {
    namesCount,
    registeredCount,
    graceCount,
    premiumCount,
    availableCount,
  }
}
