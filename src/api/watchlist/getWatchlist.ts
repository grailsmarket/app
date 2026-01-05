import { WatchlistItemType } from '@/types/domains'
import { authFetch } from '../authFetch'
import { API_URL } from '@/constants/api'
import { APIResponseType, PaginationType } from '@/types/api'
import { MarketplaceFiltersState } from '@/state/reducers/filters/marketplaceFilters'
import { PortfolioFiltersState } from '@/types/filters'
import { buildQueryParamString } from '@/utils/api/buildQueryParamString'
import { MARKETPLACE_TYPE_FILTER_PARAM_OPTIONS } from '@/constants/filters/marketplaceFilters'
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
    'Expiring Soon': 'grace',
    Premium: 'premium',
    Available: 'available',
  }

  const search = normalizeName(searchTerm.replace('.eth', '').toLowerCase().trim())
  const statusFilter = filters.status.filter(
    (status) => API_STATUS_FILTER_OPTIONS[status as keyof typeof API_STATUS_FILTER_OPTIONS]
  )
  const typeFilter = filters.type.map(
    (type) => MARKETPLACE_TYPE_FILTER_PARAM_OPTIONS[type as keyof typeof MARKETPLACE_TYPE_FILTER_PARAM_OPTIONS]
  )
  const paramString = buildQueryParamString({
    limit,
    page: pageParam,
    q: search?.length > 0 ? search : undefined,
    'filters[listed]': filters.status.includes('Listed')
      ? true
      : filters.status.includes('Unlisted')
        ? false
        : undefined,
    // 'filters[showListings]': filters.status.includes('Listed') ? true : undefined,
    // 'filters[showUnlisted]': filters.status.includes('Unlisted') ? true : undefined,
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
    // 'filters[hasNumbers]': filters.type.includes('Numbers') ? undefined : false,
    // 'filters[hasEmojis]': filters.type.includes('Emojis') ? undefined : false,
    'filters[letters]': typeFilter.includes('letters')
      ? typeFilter.length > 1
        ? 'include'
        : 'only'
      : typeFilter.length > 1
        ? 'exclude'
        : undefined,
    'filters[digits]': typeFilter.includes('digits')
      ? typeFilter.length > 1
        ? 'include'
        : 'only'
      : typeFilter.length > 1
        ? 'exclude'
        : undefined,
    'filters[emoji]': typeFilter.includes('emojis')
      ? typeFilter.length > 1
        ? 'include'
        : 'only'
      : typeFilter.length > 1
        ? 'exclude'
        : undefined,
    'filters[repeatingChars]': typeFilter.includes('repeatingChars')
      ? typeFilter.length > 1
        ? 'include'
        : 'only'
      : undefined,
    'filters[clubs][]': filters.categories?.join(',') || null,
    'filters[status]':
      statusFilter.length === 1
        ? API_STATUS_FILTER_OPTIONS[statusFilter[0] as keyof typeof API_STATUS_FILTER_OPTIONS]
        : undefined,
    // 'filters[isGracestatuPeriod]': statusFilter.includes('Grace Period') ? true : undefined,
    // 'filters[isPremiumPeriod]': statusFilter.includes('Premium') ? true : undefined,
    // 'filters[expiringWithinDays]': statusFilter.includes('Expiring Soon') ? 60 : undefined,
    // @ts-expect-error - TS tantrum
    'filters[hasSales]': filters.status.includes('Has Last Sale') ? true : undefined,
    'filters[hasOffer]': filters.status.includes('Has Offers') ? true : undefined,
    sortBy: filters.sort?.replace('_desc', '').replace('_asc', ''),
    sortOrder: filters.sort ? (filters.sort.includes('asc') ? 'asc' : 'desc') : null,
  })

  const response = await authFetch(`${API_URL}/watchlist?${paramString}`, {
    method: 'GET',
    mode: 'cors',
  })

  const data = (await response.json()) as APIResponseType<{
    watchlist: WatchlistItemType[]
    pagination: PaginationType
  }>

  return {
    watchlist: data.data.watchlist,
    total: data.data.pagination.total,
    nextPageParam: data.data.pagination.page + 1,
    hasNextPage: data.data.pagination.hasNext,
  }
}
