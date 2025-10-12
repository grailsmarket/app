import { MarketplaceDomainType } from '@/types/domains'
import { buildQueryParamString } from '@/utils/api/buildQueryParamString'
import { MarketplaceFiltersState } from '@/state/reducers/filters/marketplaceFilters'

import { API_URL, DEFAULT_FETCH_LIMIT } from '@/constants/api'
import {
  MARKETPLACE_SORT_FILTERS,
  MARKETPLACE_OFFERS_PARAM_OPTIONS,
  MARKETPLACE_STATUS_PARAM_OPTIONS,
} from '@/constants/filters/marketplaceFilters'
import { APIResponseType } from '@/types/api'

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
  const paramString = buildQueryParamString({
    limit,
    page: pageParam + 1,
    // q: searchTerm.replace('.eth', ''),
    // 'filters[maxLength]': filters.length.max.replace('10+', ''),
    // 'filters[minLength]': filters.length.min.replace('10+', '10'),
    // 'filters[maxPrice]': filters.priceRange.max ? Number(filters.priceRange.max) * 10 ** 18 : filters.priceRange.max,
    // 'filters[minPrice]': filters.priceRange.min ? Number(filters.priceRange.min) * 10 ** 18 : filters.priceRange.max,
    // search_terms: filters.categoryObjects.map((f) => f.subcategory).join(','),
    // name_symbols_type: filters.type.join(',').toLowerCase(),
    // has_offers_selector: filters.status
    //   .map((statusValue) => MARKETPLACE_OFFERS_PARAM_OPTIONS[statusValue])
    //   .filter((e) => e)
    //   .join(','),
    // status_type:
    //   filters.status.map((statusValue) => MARKETPLACE_STATUS_PARAM_OPTIONS[statusValue]).filter((e) => e)[0] || '',
  })

  const endpoint = searchTerm.length > 0 ? `names/search` : `names`

  console.log(paramString)

  const res = await fetch(`${API_URL}/${endpoint}?${paramString}`, {
    method: 'GET',
    mode: 'cors',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  })

  const json = (await res.json()) as APIResponseType<{ names: MarketplaceDomainType[] }>

  return {
    domains: json.data.names,
    nextPageParam: pageParam + 1,
  }
}
