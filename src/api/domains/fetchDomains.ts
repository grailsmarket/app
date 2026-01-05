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
import { MARKETPLACE_TYPE_FILTER_PARAM_OPTIONS } from '@/constants/filters/marketplaceFilters'

interface FetchDomainsOptions {
  limit: number
  pageParam: number
  filters: MarketplaceFiltersState | PortfolioFiltersState
  searchTerm: string
  ownerAddress?: Address
  category?: string
  enableBulkSearch?: boolean
}

export const fetchDomains = async ({
  limit = DEFAULT_FETCH_LIMIT,
  pageParam,
  filters,
  searchTerm,
  ownerAddress,
  category,
  enableBulkSearch = false,
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

      console.log('search')

      const res = await fetch(`${API_URL}/search/bulk`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          terms: search.split(','),
          page: pageParam,
          limit,
        }),
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
      'filters[owner]': ownerAddress || null,
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
      'filters[clubs][]': category || filters.categories?.join(',') || null,
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
