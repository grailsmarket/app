import { getWatchlist } from '@/api/watchlist/getWatchlist'
import { DEFAULT_FETCH_LIMIT } from '@/constants/api'
import { useUserContext } from '@/context/user'
import { useDebounce } from '@/hooks/useDebounce'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { selectMyDomainsFilters } from '@/state/reducers/filters/myDomainsFilters'
import { addUserWatchlistDomains } from '@/state/reducers/portfolio/profile'
import { MarketplaceDomainType } from '@/types/domains'
import { nameHasEmoji, nameHasNumbers } from '@/utils/nameCharacters'
import { useInfiniteQuery } from '@tanstack/react-query'

export const useWatchlistDomains = () => {
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
      'portfolio',
      'watchlist',
      userAddress,
      debouncedSearch,
      filters.length,
      filters.priceRange,
      filters.categories,
      filters.type,
      filters.status,
      filters.sort,
    ],
    queryFn: async ({ pageParam = 1 }) => {
      if (!userAddress)
        return {
          domains: [],
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
        nextPageParam: response.nextPageParam,
        hasNextPage: response.hasNextPage,
      }
    },
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.nextPageParam : undefined),
    initialPageParam: 1,
    enabled: !!userAddress && authStatus === 'authenticated',
  })

  return {
    watchlistDomains,
    isWatchlistDomainsLoading,
    isWatchlistDomainsFetchingNextPage,
    fetchMoreWatchlistDomains,
    hasMoreWatchlistDomains,
  }
}
