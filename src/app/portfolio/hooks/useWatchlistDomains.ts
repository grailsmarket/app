import { getWatchlist } from '@/api/watchlist/getWatchlist'
import { useDebounce } from '@/hooks/useDebounce'
import { useAppSelector } from '@/state/hooks'
import { selectMyDomainsFilters } from '@/state/reducers/filters/myDomainsFilters'
import { MarketplaceDomainType } from '@/types/domains'
import { useInfiniteQuery } from '@tanstack/react-query'

export const useWatchlistDomains = () => {
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
      debouncedSearch,
      filters.length,
      filters.priceRange,
      filters.categoryObjects,
      filters.type,
      filters.status,
      filters.sort,
    ],
    queryFn: async () => {
      const response = await getWatchlist()

      const domains: MarketplaceDomainType[] = response.response.watchlist.map((domain) => ({
        name: domain.ensName,
        token_id: domain.nameData.tokenId,
        expiry_date: domain.nameData.expiryDate,
        registration_date: null,
        owner: domain.nameData.ownerAddress,
        character_count: domain.ensName.length,
        metadata: {},
        has_numbers: false,
        has_emoji: false,
        listings: [],
        clubs: [],
        listing_created_at: null,
        highest_offer: null,
        offer: null,
        last_sale_price: null,
        last_sale_asset: null,
      }))

      return {
        domains,
        nextPageParam: 0,
        hasNextPage: false,
      }
    },
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.nextPageParam : undefined),
    initialPageParam: 0,
  })

  return {
    watchlistDomains,
    isWatchlistDomainsLoading,
    isWatchlistDomainsFetchingNextPage,
    fetchMoreWatchlistDomains,
    hasMoreWatchlistDomains,
  }
}
