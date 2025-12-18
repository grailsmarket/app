import { WatchlistItemType } from '@/types/domains'
import { authFetch } from '../authFetch'
import { API_URL } from '@/constants/api'
import { APIResponseType, PaginationType } from '@/types/api'
import { MarketplaceFiltersState, MarketplaceStatusFilterType } from '@/state/reducers/filters/marketplaceFilters'
import { PortfolioFiltersState, PortfolioStatusFilterType } from '@/types/filters'
import { buildQueryParamString } from '@/utils/api/buildQueryParamString'

interface GetWatchlistOptions {
  limit: number
  pageParam: number
  filters: MarketplaceFiltersState | PortfolioFiltersState
  searchTerm: string
}

export const getWatchlist = async ({ limit, pageParam, filters, searchTerm }: GetWatchlistOptions) => {
  const statusFilter = filters.status as (MarketplaceStatusFilterType | PortfolioStatusFilterType)[]
  const paramString = buildQueryParamString({
    limit,
    page: pageParam,
    q: searchTerm?.length > 0 ? searchTerm.replace('.eth', '') : '',
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
    'filters[clubs][]': filters.categories?.join(',') || undefined,
    // 'filters[isExpired]': statusFilter.includes('Available') ? true : undefined,
    'filters[isGracePeriod]': statusFilter.includes('Grace Period') ? true : undefined,
    // 'filters[isPremiumPeriod]': statusFilter.includes('Premium') ? true : undefined,
    'filters[expiringWithinDays]': statusFilter.includes('Expiring Soon') ? 60 : undefined,
    'filters[hasSales]': statusFilter.includes('Has Last Sale') ? true : undefined,
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
