import { Address, hexToBigInt, namehash } from 'viem'
import { MarketplaceDomainType } from '@/types/domains'
import { API_URL, DEFAULT_FETCH_LIMIT } from '@/constants/api'
import { APIResponseType, PaginationType } from '@/types/api'
import { buildQueryParamString } from '@/utils/api/buildQueryParamString'
import { PortfolioFiltersState, PortfolioStatusFilterType } from '@/types/filters'
import { MarketplaceFiltersState, MarketplaceStatusFilterType } from '@/state/reducers/filters/marketplaceFilters'
import { nameHasEmoji } from '@/utils/nameCharacters'
import { nameHasNumbers } from '@/utils/nameCharacters'

interface FetchDomainsOptions {
  limit: number
  pageParam: number
  filters: MarketplaceFiltersState | PortfolioFiltersState
  searchTerm: string
  ownerAddress?: Address
  category?: string
}

export const fetchDomains = async ({
  limit = DEFAULT_FETCH_LIMIT,
  pageParam,
  filters,
  searchTerm,
  ownerAddress,
  category,
}: FetchDomainsOptions) => {
  try {
    const search = searchTerm.replace('.eth', '').toLowerCase().trim()
    const statusFilter = filters.status as (MarketplaceStatusFilterType | PortfolioStatusFilterType)[]
    const paramString = buildQueryParamString({
      limit,
      page: pageParam,
      q: search?.length > 0 ? search : undefined,
      'filters[owner]': ownerAddress || null,
      'filters[showListings]': filters.status.includes('Listed') ? true : undefined,
      'filters[maxLength]': filters.length.max || null,
      'filters[minLength]': filters.length.min || null,
      'filters[maxPrice]': filters.priceRange.max
        ? Number(filters.priceRange.max) * 10 ** 18
        : filters.priceRange.max || null,
      'filters[minPrice]': filters.priceRange.min
        ? Number(filters.priceRange.min) * 10 ** 18
        : filters.priceRange.max || null,
      'filters[hasNumbers]': filters.type.includes('Numbers') ? undefined : false,
      'filters[hasEmojis]': filters.type.includes('Emojis') ? undefined : false,
      'filters[clubs][]': category || filters.categories?.join(',') || null,
      // 'filters[isExpired]': statusFilter.includes('Available') ? true : undefined,
      'filters[isGracePeriod]': statusFilter.includes('Grace Period') ? true : undefined,
      'filters[isPremiumPeriod]': statusFilter.includes('Premium') ? true : undefined,
      'filters[expiringWithinDays]': statusFilter.includes('Expiring Soon') ? 60 : undefined,
      'filters[hasSales]': statusFilter.includes('Has Last Sale') ? true : undefined,
      sortBy: filters.sort?.replace('_desc', '').replace('_asc', ''),
      sortOrder: filters.sort ? (filters.sort.includes('asc') ? 'asc' : 'desc') : null,
    })

    const res = await fetch(`${API_URL}/search?${paramString}`, {
      method: 'GET',
      mode: 'cors',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })

    const json = (await res.json()) as APIResponseType<{
      names: MarketplaceDomainType[]
      results: MarketplaceDomainType[]
      pagination: PaginationType
    }>
    const domains = json.data.names || json.data.results

    const areExcludingFiltersPresent =
      statusFilter.length > 0 ||
      ownerAddress ||
      category ||
      filters.length.min ||
      filters.length.max ||
      filters.priceRange.min ||
      filters.priceRange.max

    if (pageParam === 1) {
      if (search.length >= 3 && !areExcludingFiltersPresent) {
        const name = search + '.eth'
        if (!domains.map((domain) => domain.name).includes(name)) {
          const tokenId = hexToBigInt(namehash(name))
          domains.unshift({
            id: 2229391,
            name,
            token_id: tokenId.toString(),
            expiry_date: null,
            registration_date: null,
            owner: null,
            metadata: {},
            has_numbers: nameHasNumbers(name),
            has_emoji: nameHasEmoji(name),
            listings: [],
            clubs: [],
            highest_offer_wei: null,
            highest_offer_id: null,
            highest_offer_currency: null,
            last_sale_price_usd: null,
            offer: null,
            last_sale_price: null,
            last_sale_currency: null,
            last_sale_date: null,
            view_count: 0,
            watchers_count: 0,
            downvotes: 0,
            upvotes: 0,
          })
        }
      }
    }

    return {
      domains,
      total: json.data.pagination.total,
      nextPageParam: json.data.pagination.page + 1,
      hasNextPage: json.data.pagination.hasNext,
    }
  } catch (e) {
    console.error(e)
    return {
      domains: [],
      nextPageParam: pageParam,
      hasNextPage: false,
    }
  }
}
