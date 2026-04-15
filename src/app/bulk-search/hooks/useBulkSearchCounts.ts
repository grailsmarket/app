import { fetchDomains } from '@/api/domains/fetchDomains'
import { useUserContext } from '@/context/user'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useAppSelector } from '@/state/hooks'
import { selectBulkSearch } from '@/state/reducers/bulkSearch/bulkSearch'

const STATUS_TABS = [
  { key: 'names', status: [] },
  { key: 'registered', status: ['Registered'] },
  { key: 'grace', status: ['Grace'] },
  { key: 'premium', status: ['Premium'] },
  { key: 'available', status: ['Available'] },
] as const

const useBulkSearchCount = (tabKey: string, forcedStatus: string[]) => {
  const { authStatus } = useUserContext()
  const filters = useFilterRouter().selectors.filters
  const { searchTerms } = useAppSelector(selectBulkSearch)

  const { data } = useInfiniteQuery({
    queryKey: [
      'bulkSearch',
      'domains',
      searchTerms,
      tabKey,
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
    queryFn: async ({ pageParam = 1 }) => {
      const filtersWithStatus = {
        ...filters,
        status: forcedStatus,
      }

      const result = await fetchDomains({
        limit: 1,
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
    enabled: !!searchTerms,
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.nextPageParam : undefined),
    initialPageParam: 1,
  })

  const count = data?.pages[0]?.total || 0

  return count
}

export const useBulkSearchCounts = () => {
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
