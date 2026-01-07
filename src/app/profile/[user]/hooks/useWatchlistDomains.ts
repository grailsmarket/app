import { Address } from 'viem'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useDebounce } from '@/hooks/useDebounce'
import { useUserContext } from '@/context/user'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { selectMyDomainsFilters } from '@/state/reducers/filters/myDomainsFilters'
import { addUserWatchlistDomains } from '@/state/reducers/portfolio/profile'
import { getWatchlist } from '@/api/watchlist/getWatchlist'
import { nameHasEmoji, nameHasNumbers } from '@/utils/nameCharacters'
import { DEFAULT_FETCH_LIMIT } from '@/constants/api'
import { MarketplaceDomainType } from '@/types/domains'

export const useWatchlistDomains = (user: Address | undefined) => {
  const dispatch = useAppDispatch()
  const { userAddress, authStatus } = useUserContext()
  const filters = useAppSelector(selectMyDomainsFilters)
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

      dispatch(addUserWatchlistDomains(response.watchlist))

      const domains: MarketplaceDomainType[] = response.watchlist.map((domain) => ({
        id: domain.ensNameId,
        watchlist_id: domain.id,
        name: domain.ensName,
        token_id: domain.nameData.tokenId,
        expiry_date: domain.nameData.expiryDate,
        registration_date: null,
        owner: domain.nameData.ownerAddress,
        character_count: domain.ensName.length,
        metadata: {},
        has_numbers: nameHasNumbers(domain.ensName),
        has_emoji: nameHasEmoji(domain.ensName),
        listings: domain.nameData.activeListing ? [domain.nameData.activeListing] : [],
        clubs: [],
        listing_created_at: null,
        highest_offer_currency: null,
        highest_offer_id: null,
        highest_offer_wei: null,
        offer: null,
        last_sale_price: null,
        last_sale_currency: null,
        last_sale_date: null,
        last_sale_price_usd: null,
        view_count: 0,
        downvotes: 0,
        upvotes: 0,
        watchers_count: 0,
      }))

      return {
        domains,
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
