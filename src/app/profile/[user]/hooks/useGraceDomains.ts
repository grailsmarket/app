import { fetchDomains } from '@/api/domains/fetchDomains'
import { DEFAULT_FETCH_LIMIT } from '@/constants/api'
import { useDebounce } from '@/hooks/useDebounce'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Address } from 'viem'
import { selectProfileGraceFilters } from '@/state/reducers/filters/profileGraceFilters'
import { useAppSelector } from '@/state/hooks'
import { useUserContext } from '@/context/user'

export const useGraceDomains = (user: Address | undefined) => {
  const { authStatus } = useUserContext()
  const filters = useAppSelector(selectProfileGraceFilters)
  const debouncedSearch = useDebounce(filters.search, 500)

  const {
    data: graceDomains,
    isLoading,
    isFetchingNextPage,
    fetchNextPage: fetchMoreGraceDomains,
    hasNextPage: hasMoreGraceDomains,
  } = useInfiniteQuery({
    queryKey: [
      'profile',
      'grace',
      user,
      debouncedSearch,
      filters.length,
      filters.priceRange,
      filters.categories,
      filters.type,
      filters.status,
      filters.sort,
      filters.market,
      filters.textMatch,
      filters.textNonMatch,
      filters.offerRange,
    ],
    queryFn: async ({ pageParam = 1 }) => {
      if (!user)
        return {
          domains: [],
          total: 0,
          nextPageParam: pageParam,
          hasNextPage: false,
        }

      const domains = await fetchDomains({
        limit: DEFAULT_FETCH_LIMIT,
        pageParam,
        filters,
        searchTerm: debouncedSearch,
        ownerAddress: user,
        isAuthenticated: authStatus === 'authenticated',
      })

      return {
        domains: domains.domains,
        total: domains.total,
        nextPageParam: domains.nextPageParam,
        hasNextPage: domains.hasNextPage,
      }
    },
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.nextPageParam : undefined),
    initialPageParam: 1,
    enabled: !!user,
  })

  const graceDomainsLoading = isLoading || isFetchingNextPage
  const totalGraceDomains = graceDomains?.pages[0]?.total || 0

  return {
    graceDomains,
    graceDomainsLoading,
    fetchMoreGraceDomains,
    hasMoreGraceDomains,
    totalGraceDomains,
  }
}
