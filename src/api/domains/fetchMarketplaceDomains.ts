import { MarketplaceDomainType } from '@/types/domains'
import { buildQueryParamString } from '@/utils/api/buildQueryParamString'
import { MarketplaceFiltersState } from '@/state/reducers/filters/marketplaceFilters'

import { API_URL, DEFAULT_FETCH_LIMIT } from '@/constants/api'
import {
  MARKETPLACE_OFFERS_PARAM_OPTIONS,
  MARKETPLACE_STATUS_PARAM_OPTIONS,
} from '@/constants/filters/marketplaceFilters'
import { APIResponseType, PaginationType } from '@/types/api'
import { Address } from 'viem'
import { PortfolioFiltersState } from '@/types/filters'

interface FetchMarketplaceDomainsOptions {
  limit: number
  pageParam: number
  filters: MarketplaceFiltersState
  searchTerm: string
  ownerAddress?: Address
}

export const fetchMarketplaceDomains = async ({
  limit = DEFAULT_FETCH_LIMIT,
  pageParam,
  filters,
  searchTerm,
  ownerAddress,
}: FetchMarketplaceDomainsOptions) => {
  try {
    const paramString = buildQueryParamString({
      limit,
      page: pageParam + 1,
      q: searchTerm?.length > 0 ? searchTerm.replace('.eth', '') : null,
      owner: ownerAddress || null,
      'filters[maxLength]': filters.length.max || null,
      'filters[minLength]': filters.length.min || null,
      'filters[maxPrice]': filters.priceRange.max ? Number(filters.priceRange.max) * 10 ** 18 : filters.priceRange.max,
      'filters[minPrice]': filters.priceRange.min ? Number(filters.priceRange.min) * 10 ** 18 : filters.priceRange.max,
      'filters[hasNumbers]': filters.type.includes('Numbers') ? true : false,
      'filters[hasEmojis]': filters.type.includes('Emojis') ? true : false,
      'filters[clubs]': filters.categoryObjects.map((f) => f.category).join(','),
      'filters[isExpired]': filters.status.includes('Available') ? true : false,
      'filters[isGracePeriod]': filters.status.includes('Grace Period') ? true : false,
      'filters[isPremiumPeriod]': filters.status.includes('Premium') ? true : false,
      'filters[expiringWithinDays]': filters.status.includes('Expires Soon') ? true : false,
      status: filters.status
        .map((statusValue) => MARKETPLACE_STATUS_PARAM_OPTIONS[statusValue])
        .filter((e) => e)
        .join(','),
    })

    const endpoint = searchTerm?.length > 0 ? `names/search` : `names`

    const res = await fetch(`${API_URL}/${endpoint}?${paramString}`, {
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
