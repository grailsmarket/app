import { Address } from 'viem'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useDebounce } from '@/hooks/useDebounce'
import { useUserContext } from '@/context/user'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { addUserWatchlistDomains } from '@/state/reducers/portfolio/profile'
import { getWatchlist } from '@/api/watchlist/getWatchlist'
import { DEFAULT_FETCH_LIMIT } from '@/constants/api'
import { selectWatchlistFilters } from '@/state/reducers/filters/watchlistFilters'

export const useWatchlistDomains = (user: Address | undefined) => {
  const dispatch = useAppDispatch()
  const { userAddress, authStatus } = useUserContext()
  const filters = useAppSelector(selectWatchlistFilters)
  const debouncedSearch = useDebounce(filters.search, 500)

  const {
    data: watchlistDomains,
    isLoading: isWatchlistDomainsLoading,
    isFetchingNextPage: isWatchlistDomainsFetchingNextPage,
    fetchNextPage: fetchMoreWatchlistDomains,
    hasNextPage: hasMoreWatchlistDomains,
  } = useInfiniteQuery({
    queryKey: [
      'profile',
      'watchlist',
      userAddress,
      debouncedSearch,
      filters.length,
      filters.priceRange,
      filters.categories,
      filters.type,
      filters.status,
      filters.sort,
      filters.textMatch,
      filters.market,
    ],
    queryFn: async ({ pageParam = 1 }) => {
      if (!user || user.toLowerCase() !== userAddress?.toLowerCase())
        return {
          domains: [],
          total: 0,
          nextPageParam: 0,
          hasNextPage: false,
        }

      const response = await getWatchlist({
        limit: DEFAULT_FETCH_LIMIT,
        pageParam,
        filters,
        searchTerm: debouncedSearch,
      })

      dispatch(addUserWatchlistDomains(response.results))

      return {
        domains: response.results,
        total: response.total,
        nextPageParam: response.nextPageParam,
        hasNextPage: response.hasNextPage,
      }
    },
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.nextPageParam : undefined),
    initialPageParam: 1,
    enabled:
      !!user && !!userAddress && user.toLowerCase() === userAddress.toLowerCase() && authStatus === 'authenticated',
  })

  const totalWatchlistDomains = watchlistDomains?.pages[0]?.total || 0

  return {
    watchlistDomains,
    isWatchlistDomainsLoading,
    isWatchlistDomainsFetchingNextPage,
    fetchMoreWatchlistDomains,
    hasMoreWatchlistDomains,
    totalWatchlistDomains,
  }
}
