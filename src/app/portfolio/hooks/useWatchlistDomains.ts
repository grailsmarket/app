import { getWatchlist } from '@/api/watchlist/getWatchlist'
import { useDebounce } from '@/hooks/useDebounce'
import { useAppSelector } from '@/state/hooks'
import { selectMyDomainsFilters } from '@/state/reducers/filters/myDomainsFilters'
import { MarketplaceDomainType } from '@/types/domains'
import { PortfolioTabType } from '@/types/filters'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { useState } from 'react'

export const useWatchlistDomains = () => {
  const queryParams = useParams()
  const selectedTab = queryParams.tab as PortfolioTabType
  const defaultSearch = selectedTab === 'watchlist' ? (queryParams.search as string) || '' : ''
  const [search, setSearch] = useState(defaultSearch)
  const debouncedSearch = useDebounce(search, 500)
  const filters = useAppSelector(selectMyDomainsFilters)

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
        id: domain.id,
        name: domain.ensName,
        token_id: domain.nameData.tokenId,
        expiry_date: domain.nameData.expiryDate,
        owner_address: domain.nameData.ownerAddress,
        price: domain.nameData.listingPrice,
        registration_date: null,
        character_count: domain.ensName.length,
        has_numbers: false,
        has_emoji: false,
        registrant: null,
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
    search,
    setSearch,
    watchlistDomains,
    isWatchlistDomainsLoading,
    isWatchlistDomainsFetchingNextPage,
    fetchMoreWatchlistDomains,
    hasMoreWatchlistDomains,
  }
}
