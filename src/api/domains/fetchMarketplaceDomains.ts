import { MarketplaceDomainType } from '@/types/domains'
import { buildQueryParamString } from '@/utils/api/buildQueryParamString'
import { MarketplaceFiltersState } from '@/state/reducers/filters/marketplaceFilters'

import { API_URL, DEFAULT_FETCH_LIMIT } from '@/constants/api'
import {
  MARKETPLACE_OFFERS_PARAM_OPTIONS,
  MARKETPLACE_STATUS_PARAM_OPTIONS,
} from '@/constants/filters/marketplaceFilters'
import { APIResponseType, PaginationType } from '@/types/api'

interface FetchMarketplaceDomainsOptions {
  limit: number
  pageParam: number
  filters: MarketplaceFiltersState
  searchTerm: string
}

export const fetchMarketplaceDomains = async ({
  limit = DEFAULT_FETCH_LIMIT,
  pageParam,
  filters,
  searchTerm,
}: FetchMarketplaceDomainsOptions) => {
  try {
    const paramString = buildQueryParamString({
      limit,
      page: pageParam + 1,
      q: searchTerm?.length > 0 ? searchTerm.replace('.eth', '') : null,
      'filters[maxLength]': filters.length.max || null,
      'filters[minLength]': filters.length.min || null,
      'filters[maxPrice]': filters.priceRange.max ? Number(filters.priceRange.max) * 10 ** 18 : filters.priceRange.max,
      'filters[minPrice]': filters.priceRange.min ? Number(filters.priceRange.min) * 10 ** 18 : filters.priceRange.max,
      search_terms: filters.categoryObjects.map((f) => f.subcategory).join(','),
      name_symbols_type: filters.type.join(',').toLowerCase(),
      has_offers_selector: filters.status
        .map((statusValue) => MARKETPLACE_OFFERS_PARAM_OPTIONS[statusValue])
        .filter((e) => e)
        .join(','),
      status:
        filters.status.map((statusValue) => MARKETPLACE_STATUS_PARAM_OPTIONS[statusValue]).filter((e) => e)[0] || '',
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
