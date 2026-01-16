import { Address, hexToBigInt, namehash } from 'viem'
import { MarketplaceDomainType } from '@/types/domains'
import { API_URL, DEFAULT_FETCH_LIMIT } from '@/constants/api'
import { APIResponseType, PaginationType } from '@/types/api'
import { buildQueryParamString } from '@/utils/api/buildQueryParamString'
import { PortfolioFiltersState } from '@/types/filters'
import { MarketplaceFiltersState } from '@/state/reducers/filters/marketplaceFilters'
import { nameHasEmoji } from '@/utils/nameCharacters'
import { nameHasNumbers } from '@/utils/nameCharacters'
import { normalizeName } from '@/lib/ens'
import { BigNumber } from '@ethersproject/bignumber'
import { authFetch } from '../authFetch'

interface FetchDomainsOptions {
  limit: number
  pageParam: number
  filters: MarketplaceFiltersState | PortfolioFiltersState
  searchTerm: string
  ownerAddress?: Address
  category?: string
  enableBulkSearch?: boolean
  isAuthenticated?: boolean
  inAnyCategory?: boolean
  signal?: AbortSignal
}

export const fetchDomains = async ({
  limit = DEFAULT_FETCH_LIMIT,
  pageParam,
  filters,
  searchTerm,
  ownerAddress,
  category,
  enableBulkSearch = false,
  isAuthenticated = false,
  inAnyCategory = false,
  signal,
}: FetchDomainsOptions) => {
  try {
    const isBulkSearching = searchTerm.replaceAll(' ', ',').split(',').length > 1

    if (isBulkSearching && enableBulkSearch) {
      const search = searchTerm
        .replaceAll(' ', ',')
        .split(',')
        .map((name) => normalizeName(name.replace('.eth', '').toLowerCase().trim()))
        .filter((name) => name.length > 2)
        .join(',')

      const res = await fetch(`${API_URL}/search/bulk`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          terms: search.split(','),
          page: pageParam,
          limit,
        }),
        signal,
      })

      const json = (await res.json()) as APIResponseType<{
        names: MarketplaceDomainType[]
        results: MarketplaceDomainType[]
        pagination: PaginationType
      }>

      const domains = json.data.names || json.data.results

      return {
        domains,
        total: json.data.pagination.total,
        nextPageParam: json.data.pagination.page + 1,
        hasNextPage: json.data.pagination.hasNext,
      }
    }

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

    const typeFilters = filters.type

    const marketFilters = filters.market
    const getMarketFilterValue = (value: string | undefined): boolean | undefined => {
      if (value === 'yes') return true
      if (value === 'no') return false
      return undefined
    }

    const textMatchFilters = filters.textMatch
    const textNonMatchFilters = filters.textNonMatch
    const getTextMatchFilterValue = (value: string | undefined): string | undefined => {
      return value && value.trim().length > 0 ? value.trim() : undefined
    }

    const paramString = buildQueryParamString({
      limit,
      page: pageParam,
      q: search?.length > 0 ? search : undefined,
      'filters[owner]': ownerAddress || null,
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
      'filters[letters]': typeFilters.Letters !== 'none' ? typeFilters.Letters : undefined,
      'filters[digits]': typeFilters.Digits !== 'none' ? typeFilters.Digits : undefined,
      'filters[emoji]': typeFilters.Emojis !== 'none' ? typeFilters.Emojis : undefined,
      'filters[repeatingChars]': typeFilters.Repeating !== 'none' ? typeFilters.Repeating : undefined,
      'filters[clubs][]': category || filters.categories?.join(',') || null,
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
      'filters[inAnyClub]': inAnyCategory ? 'true' : undefined,
    })

    const fetchFunction = isAuthenticated ? fetch : authFetch

    const res = await fetchFunction(`${API_URL}/search?${paramString}`, {
      method: 'GET',
      mode: 'cors',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      signal,
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
      filters.categories?.length > 0 ||
      filters.length.min ||
      filters.length.max ||
      filters.priceRange.min ||
      filters.priceRange.max ||
      filters.type.Letters === 'exclude' ||
      filters.type.Digits === 'exclude' ||
      filters.type.Emojis === 'exclude' ||
      filters.type.Repeating === 'exclude' ||
      filters.textMatch?.Contains ||
      filters.textMatch?.['Starts with'] ||
      filters.textMatch?.['Ends with'] ||
      filters.textNonMatch?.['Does not contain'] ||
      filters.textNonMatch?.['Does not start with'] ||
      filters.textNonMatch?.['Does not end with'] ||
      filters.market?.Listed !== 'none' ||
      filters.market?.['Has Last Sale'] === 'no' ||
      filters.market?.['Has Offers'] === 'no' ||
      filters.market?.marketplace !== 'none'

    if (pageParam === 1) {
      if (isBulkSearching) {
        const names = search.split(',')
        for (const name of names) {
          if (name.length >= 3 && !areExcludingFiltersPresent) {
            const domainName = name + '.eth'
            if (!domains.map((domain) => domain.name).includes(domainName)) {
              const tokenId = hexToBigInt(namehash(name))
              domains.unshift({
                id: 1, // random valid ID for now
                name: domainName,
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
                watchlist_record_id: null,
              })
            }
          }
        }
      } else {
        if (search.length >= 3 && !areExcludingFiltersPresent) {
          const name = search + '.eth'
          if (!domains.map((domain) => domain.name).includes(name)) {
            const tokenId = hexToBigInt(namehash(name))
            domains.unshift({
              id: 1, // random valid ID for now
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
              watchlist_record_id: null,
            })
          }
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
