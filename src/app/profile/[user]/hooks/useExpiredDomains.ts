import { fetchDomains } from '@/api/domains/fetchDomains'
import { DEFAULT_FETCH_LIMIT } from '@/constants/api'
import { useDebounce } from '@/hooks/useDebounce'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Address } from 'viem'
import { selectProfileExpiredFilters } from '@/state/reducers/filters/profileExpiredFilters'
import { useAppSelector } from '@/state/hooks'
import { useUserContext } from '@/context/user'
import { MarketplaceDomainType } from '@/types/domains'
import { PortfolioFiltersState } from '@/types/filters'

export const useExpiredDomains = (user: Address | undefined) => {
  const { authStatus } = useUserContext()
  const filters = useAppSelector(selectProfileExpiredFilters)
  const debouncedSearch = useDebounce(filters.search, 500)

  const {
    data: expiredDomains,
    isLoading,
    isFetchingNextPage,
    fetchNextPage: fetchMoreExpiredDomains,
    hasNextPage: hasMoreExpiredDomains,
  } = useInfiniteQuery({
    queryKey: [
      'profile',
      'expired',
      user,
      debouncedSearch,
      filters.length,
      filters.priceRange,
      filters.categories,
      filters.type,
      filters.sort,
      filters.market,
      filters.textMatch,
      filters.textNonMatch,
      // @ts-expect-error the offer range filter state will not be used for domains
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

      // Fetch both Premium and Available domains in parallel
      // Cast filters to PortfolioFiltersState for API compatibility
      const [premiumResult, availableResult] = await Promise.all([
        fetchDomains({
          limit: DEFAULT_FETCH_LIMIT,
          pageParam,
          filters: { ...filters, status: ['Premium'] } as unknown as PortfolioFiltersState,
          searchTerm: debouncedSearch,
          ownerAddress: user,
          isAuthenticated: authStatus === 'authenticated',
        }),
        fetchDomains({
          limit: DEFAULT_FETCH_LIMIT,
          pageParam,
          filters: { ...filters, status: ['Available'] } as unknown as PortfolioFiltersState,
          searchTerm: debouncedSearch,
          ownerAddress: user,
          isAuthenticated: authStatus === 'authenticated',
        }),
      ])

      // Merge and deduplicate domains
      const allDomains = [...premiumResult.domains, ...availableResult.domains]
      const uniqueDomains = allDomains.reduce((acc: MarketplaceDomainType[], domain) => {
        if (!acc.find((d) => d.token_id === domain.token_id)) {
          acc.push(domain)
        }
        return acc
      }, [])

      // Calculate combined totals
      const total = (premiumResult.total || 0) + (availableResult.total || 0)
      const hasNextPage = premiumResult.hasNextPage || availableResult.hasNextPage

      return {
        domains: uniqueDomains,
        total,
        nextPageParam: pageParam + 1,
        hasNextPage,
      }
    },
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.nextPageParam : undefined),
    initialPageParam: 1,
    enabled: !!user,
  })

  const expiredDomainsLoading = isLoading || isFetchingNextPage
  const totalExpiredDomains = expiredDomains?.pages[0]?.total || 0

  return {
    expiredDomains,
    expiredDomainsLoading,
    fetchMoreExpiredDomains,
    hasMoreExpiredDomains,
    totalExpiredDomains,
  }
}
