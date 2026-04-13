import { fetchDomains } from '@/api/domains/fetchDomains'
import { useUserContext } from '@/context/user'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { useQuery } from '@tanstack/react-query'
import { useAppSelector } from '@/state/hooks'
import { selectBulkSearch } from '@/state/reducers/bulkSearch/bulkSearch'

const STATUS_TABS = [
  { key: 'names', status: [] },
  { key: 'registered', status: ['Registered'] },
  { key: 'grace', status: ['Grace'] },
  { key: 'premium', status: ['Premium'] },
  { key: 'available', status: ['Available'] },
] as const

function useBulkSearchCount(tabKey: string, forcedStatus: string[]) {
  const { authStatus } = useUserContext()
  const filters = useFilterRouter().selectors.filters
  const { searchTerms } = useAppSelector(selectBulkSearch)

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
      // @ts-expect-error filter state type mismatch
      filters.market,
      // @ts-expect-error filter state type mismatch
      filters.textMatch,
      // @ts-expect-error filter state type mismatch
      filters.textNonMatch,
      // @ts-expect-error filter state type mismatch
      filters.offerRange,
      // @ts-expect-error filter state type mismatch
      filters.watchersCount,
      // @ts-expect-error filter state type mismatch
      filters.viewCount,
      // @ts-expect-error filter state type mismatch
      filters.clubsCount,
      // @ts-expect-error filter state type mismatch
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
    enabled: !!searchTerms,
  })

  return data
}

export function useBulkSearchCounts() {
  const namesCount = useBulkSearchCount('names', [])
  const registeredCount = useBulkSearchCount('registered', ['Registered'])
  const graceCount = useBulkSearchCount('grace', ['Grace'])
  const premiumCount = useBulkSearchCount('premium', ['Premium'])
  const availableCount = useBulkSearchCount('available', ['Available'])

  return {
    namesCount,
    registeredCount,
    graceCount,
    premiumCount,
    availableCount,
  }
}
