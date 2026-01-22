import { fetchDomains } from '@/api/domains/fetchDomains'
import { DEFAULT_FETCH_LIMIT } from '@/constants/api'
import { useDebounce } from '@/hooks/useDebounce'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Address } from 'viem'
import { selectProfileListingsFilters } from '@/state/reducers/filters/profileListingsFilter'
import { useAppSelector } from '@/state/hooks'
import { useUserContext } from '@/context/user'

export const useListings = (user: Address | undefined) => {
  const { authStatus } = useUserContext()
  const filters = useAppSelector(selectProfileListingsFilters)
  const debouncedSearch = useDebounce(filters.search, 500)

  const {
    data: listings,
    isLoading,
    isFetchingNextPage,
    fetchNextPage: fetchMoreListings,
    hasNextPage: hasMoreListings,
  } = useInfiniteQuery({
    queryKey: [
      'profile',
      'listings',
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

  const listingsLoading = isLoading || isFetchingNextPage
  const totalListings = listings?.pages[0]?.total || 0

  return {
    listings,
    listingsLoading,
    fetchMoreListings,
    hasMoreListings,
    totalListings,
  }
}
