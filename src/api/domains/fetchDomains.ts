import { Address } from 'viem'
import { MarketplaceDomainType } from '@/types/domains'
import { buildQueryParamString } from '@/utils/api/buildQueryParamString'
import { MarketplaceFiltersState, MarketplaceStatusFilterType } from '@/state/reducers/filters/marketplaceFilters'
import { API_URL, DEFAULT_FETCH_LIMIT } from '@/constants/api'
import { APIResponseType, PaginationType } from '@/types/api'
import { PortfolioFiltersState, PortfolioStatusFilterType } from '@/types/filters'

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
      page: pageParam + 1,
      q: searchTerm?.length > 0 ? searchTerm.replace('.eth', '') : '',
      owner: ownerAddress || null,
      'filters[owner]': ownerAddress || null,
      'filters[showListings]': filters.status.includes('Listed') ? true : false,
      'filters[maxLength]': filters.length.max || null,
      'filters[minLength]': filters.length.min || null,
      'filters[maxPrice]': filters.priceRange.max ? Number(filters.priceRange.max) * 10 ** 18 : filters.priceRange.max,
      'filters[minPrice]': filters.priceRange.min ? Number(filters.priceRange.min) * 10 ** 18 : filters.priceRange.max,
      'filters[hasNumbers]': filters.type.includes('Numbers') ? true : false,
      'filters[hasEmojis]': filters.type.includes('Emojis') ? true : false,
      'filters[clubs][]': club || filters.categories?.join(','),
      'filters[isExpired]': statusFilter.includes('Available') ? true : false,
      'filters[isGracePeriod]': statusFilter.includes('Grace Period') ? true : false,
      'filters[isPremiumPeriod]': statusFilter.includes('Premium') ? true : false,
      'filters[expiringWithinDays]': statusFilter.includes('Expiring Soon') ? true : false,
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
