import { Address } from 'viem'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useUserContext } from '@/context/user'
import { authFetch } from '@/api/authFetch'
import { DEFAULT_FETCH_LIMIT } from '@/constants/api'
import { MarketplaceDomainType, DomainListingType } from '@/types/domains'

interface PrivateListingApiResponse {
  id: number
  ens_name: string
  ens_name_id: number
  token_id: string
  seller_address: string
  price_wei: string
  currency_address: string
  status: string
  created_at: string
  expires_at: string | null
  name_expiry_date: string | null
  current_owner: string
  order_hash: string
  order_data: any
  source: string
}

interface PrivateListingsResponse {
  success: boolean
  data: {
    listings: PrivateListingApiResponse[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
      hasNext: boolean
      hasPrev: boolean
    }
  }
}

// Transform API response to MarketplaceDomainType format
const transformToMarketplaceDomain = (listing: PrivateListingApiResponse): MarketplaceDomainType => {
  const domainListing: DomainListingType = {
    id: listing.id,
    price: listing.price_wei,
    price_wei: listing.price_wei,
    currency_address: listing.currency_address as Address,
    status: listing.status,
    seller_address: listing.seller_address,
    order_hash: listing.order_hash,
    order_data: listing.order_data,
    expires_at: listing.expires_at || '',
    created_at: listing.created_at,
    source: listing.source || 'grails',
    broker_address: null,
    broker_fee_bps: null,
  }

  return {
    id: listing.ens_name_id || listing.id,
    name: listing.ens_name,
    token_id: listing.token_id,
    owner: listing.current_owner as Address,
    expiry_date: listing.name_expiry_date,
    registration_date: null,
    metadata: {},
    has_numbers: /\d/.test(listing.ens_name),
    has_emoji: false,
    clubs: [],
    listings: [domainListing],
    highest_offer_wei: null,
    highest_offer_id: null,
    highest_offer_currency: null,
    offer: null,
    last_sale_price: null,
    last_sale_price_usd: null,
    last_sale_currency: null,
    last_sale_date: null,
    view_count: 0,
    watchers_count: 0,
    downvotes: 0,
    upvotes: 0,
    watchlist_record_id: null,
  }
}

export const usePrivateListings = (user: Address | undefined) => {
  const { userAddress, authStatus } = useUserContext()

  const isMyProfile =
    !!user && !!userAddress && user.toLowerCase() === userAddress.toLowerCase() && authStatus === 'authenticated'

  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ['profile', 'private_listings', userAddress],
    queryFn: async ({ pageParam = 1 }) => {
      if (!isMyProfile) {
        return {
          domains: [] as MarketplaceDomainType[],
          total: 0,
          nextPage: null as number | null,
        }
      }

      const response = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/listings/private-for-me?page=${pageParam}&limit=${DEFAULT_FETCH_LIMIT}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch private listings')
      }

      const data: PrivateListingsResponse = await response.json()

      return {
        domains: data.data.listings.map(transformToMarketplaceDomain),
        total: data.data.pagination.total,
        nextPage: data.data.pagination.hasNext ? pageParam + 1 : null,
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
    enabled: isMyProfile,
    staleTime: 30000,
  })

  const privateListings = data?.pages?.flatMap((page) => page.domains) ?? []
  const totalPrivateListings = data?.pages?.[0]?.total ?? 0

  return {
    privateListings,
    isPrivateListingsLoading: isLoading,
    isPrivateListingsFetchingNextPage: isFetchingNextPage,
    fetchMorePrivateListings: fetchNextPage,
    hasMorePrivateListings: !!hasNextPage,
    totalPrivateListings,
  }
}
