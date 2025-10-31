import { Address } from 'viem'
import { MarketplaceDomainType } from '@/types/domains'
import { API_URL, DEFAULT_FETCH_LIMIT } from '@/constants/api'
import { APIResponseType, PaginationType } from '@/types/api'
import { buildQueryParamString } from '@/utils/api/buildQueryParamString'
import { PortfolioFiltersState, PortfolioStatusFilterType } from '@/types/filters'
import { MarketplaceFiltersState, MarketplaceStatusFilterType } from '@/state/reducers/filters/marketplaceFilters'

interface FetchDomainsOptions {
  limit: number
  pageParam: number
  filters: MarketplaceFiltersState | PortfolioFiltersState
  searchTerm: string
  ownerAddress?: Address
  club?: string
}

export const fetchDomains = async ({
  limit = DEFAULT_FETCH_LIMIT,
  pageParam,
  filters,
  searchTerm,
  ownerAddress,
  club,
}: FetchDomainsOptions) => {
  try {
    const statusFilter = filters.status as (MarketplaceStatusFilterType | PortfolioStatusFilterType)[]
    const paramString = buildQueryParamString({
      limit,
      page: pageParam,
      q: searchTerm?.length > 0 ? searchTerm.replace('.eth', '') : '',
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
      'filters[clubs][]': club || filters.categories?.join(',') || null,
      'filters[isExpired]': statusFilter.includes('Available') ? true : undefined,
      'filters[isGracePeriod]': statusFilter.includes('Grace Period') ? true : undefined,
      'filters[isPremiumPeriod]': statusFilter.includes('Premium') ? true : undefined,
      'filters[expiringWithinDays]': statusFilter.includes('Expiring Soon') ? true : undefined,
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

    return {
      domains,
      nextPageParam: json.data.pagination.page,
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
