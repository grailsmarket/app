import { MarketplaceDomainType } from '@/types/domains'
import { authFetch } from '../authFetch'
import { API_URL } from '@/constants/api'
import { APIResponseType, PaginationType } from '@/types/api'
import { MarketplaceFiltersState } from '@/state/reducers/filters/marketplaceFilters'
import { PortfolioFiltersState } from '@/types/filters'
import { buildQueryParamString } from '@/utils/api/buildQueryParamString'
import { normalizeName } from '@/lib/ens'
import { BigNumber } from '@ethersproject/bignumber'

interface GetWatchlistOptions {
  limit: number
  pageParam: number
  filters: MarketplaceFiltersState | PortfolioFiltersState
  searchTerm: string
}

export const getWatchlist = async ({ limit, pageParam, filters, searchTerm }: GetWatchlistOptions) => {
  const API_STATUS_FILTER_OPTIONS = {
    Registered: 'registered',
    Grace: 'grace',
    Premium: 'premium',
    Available: 'available',
  }

  const search = normalizeName(searchTerm.replace('.eth', '').toLowerCase().trim())
  const statusFilter = filters.status.filter(
    (status) => API_STATUS_FILTER_OPTIONS[status as keyof typeof API_STATUS_FILTER_OPTIONS]
  )
  // Type filters - using object structure with include/exclude/only values
  const typeFilters = filters.type

  // Market filters - convert 'yes'/'no'/'none' to true/false/undefined
  const marketFilters = filters.market
  const getMarketFilterValue = (value: string | undefined): boolean | undefined => {
    if (value === 'yes') return true
    if (value === 'no') return false
    return undefined
  }

  // Text Match filters - only include if non-empty
  const textMatchFilters = filters.textMatch
  const textNonMatchFilters = filters.textNonMatch
  const getTextMatchFilterValue = (value: string | undefined): string | undefined => {
    return value && value.trim().length > 0 ? value.trim() : undefined
  }

  const paramString = buildQueryParamString({
    limit,
    page: pageParam,
    q: search?.length > 0 ? search : undefined,
    'filters[listed]': getMarketFilterValue(marketFilters?.Listed),
    'filters[maxLength]': filters.length.max || null,
    'filters[minLength]': filters.length.min || null,
    'filters[maxPrice]': filters.priceRange.max
      ? BigNumber.from(Math.floor(filters.priceRange.max * 10 ** 6))
          .mul(BigNumber.from(10).pow(12))
          .toString()
      : filters.priceRange.max || null,
    'filters[minPrice]': filters.priceRange.min
      ? BigNumber.from(Math.floor(filters.priceRange.min * 10 ** 6))
          .mul(BigNumber.from(10).pow(12))
          .toString()
      : filters.priceRange.min || null,
    'filters[maxOffer]': filters.offerRange?.max
      ? BigNumber.from(Math.floor(filters.offerRange.max * 10 ** 6))
          .mul(BigNumber.from(10).pow(12))
          .toString()
      : filters.offerRange?.max || null,
    'filters[minOffer]': filters.offerRange?.min
      ? BigNumber.from(Math.floor(filters.offerRange.min * 10 ** 6))
          .mul(BigNumber.from(10).pow(12))
          .toString()
      : filters.offerRange?.min || null,
    'filters[minWatchersCount]': filters.watchersCount?.min || null,
    'filters[maxWatchersCount]': filters.watchersCount?.max || null,
    'filters[minViewCount]': filters.viewCount?.min || null,
    'filters[maxViewCount]': filters.viewCount?.max || null,
    'filters[minClubsCount]': filters.clubsCount?.min || null,
    'filters[maxClubsCount]': filters.clubsCount?.max || null,
    'filters[letters]': typeFilters.Letters !== 'none' ? typeFilters.Letters : undefined,
    'filters[digits]': typeFilters.Digits !== 'none' ? typeFilters.Digits : undefined,
    'filters[emoji]': typeFilters.Emojis !== 'none' ? typeFilters.Emojis : undefined,
    'filters[repeatingChars]': typeFilters.Repeating !== 'none' ? typeFilters.Repeating : undefined,
    'filters[clubs][]': filters.categories?.join(',') || null,
    'filters[status]':
      statusFilter.length === 1
        ? API_STATUS_FILTER_OPTIONS[statusFilter[0] as keyof typeof API_STATUS_FILTER_OPTIONS]
        : undefined,
    'filters[hasSales]': getMarketFilterValue(marketFilters?.['Has Last Sale']),
    'filters[hasOffer]': getMarketFilterValue(marketFilters?.['Has Offers']),
    'filters[marketplace]': marketFilters?.marketplace !== 'none' ? marketFilters?.marketplace : undefined,
    'filters[contains]': getTextMatchFilterValue(textMatchFilters?.Contains),
    'filters[startsWith]': getTextMatchFilterValue(textMatchFilters?.['Starts with']),
    'filters[endsWith]': getTextMatchFilterValue(textMatchFilters?.['Ends with']),
    'filters[doesNotContain]': getTextMatchFilterValue(textNonMatchFilters?.['Does not contain']),
    'filters[doesNotStartWith]': getTextMatchFilterValue(textNonMatchFilters?.['Does not start with']),
    'filters[doesNotEndWith]': getTextMatchFilterValue(textNonMatchFilters?.['Does not end with']),
    sortBy: filters.sort?.replace('_desc', '').replace('_asc', ''),
    sortOrder: filters.sort ? (filters.sort.includes('asc') ? 'asc' : 'desc') : null,
  })

  const response = await authFetch(`${API_URL}/watchlist/search?${paramString}`, {
    method: 'GET',
    mode: 'cors',
  })

  const data = (await response.json()) as APIResponseType<{
    results: MarketplaceDomainType[]
    pagination: PaginationType
  }>

  return {
    results: data.data.results,
    total: data.data.pagination.total,
    nextPageParam: data.data.pagination.page + 1,
    hasNextPage: data.data.pagination.hasNext,
  }
}
