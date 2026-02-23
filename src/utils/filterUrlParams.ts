import {
  DEFAULT_TYPE_FILTERS_STATE,
  DEFAULT_MARKET_FILTERS_STATE,
  DEFAULT_TEXT_MATCH_FILTERS_STATE,
  DEFAULT_TEXT_NON_MATCH_FILTERS_STATE,
  TypeFiltersState,
  MarketFiltersState,
  TextMatchFiltersState,
  TextNonMatchFiltersState,
  TypeFilterOption,
  MarketFilterOption,
  MarketplaceOption,
} from '@/constants/filters/marketplaceFilters'
import { PRICE_DENOMINATIONS } from '@/constants/filters'
import {
  CategoriesPageTypeOption,
  CategoriesPageSortOption,
  CategoriesPageSortDirection,
  DEFAULT_CATEGORIES_PAGE_SORT,
  DEFAULT_CATEGORIES_PAGE_SORT_DIRECTION,
} from '@/constants/filters/categoriesPageFilters'

// Maximum search length to include in URL (characters)
// Above this limit, search will work in the app but won't be reflected in URL
// This prevents URL truncation issues with bulk search
export const MAX_SEARCH_URL_LENGTH = 10000

// URL parameter keys
export const URL_PARAMS = {
  tab: 'tab',
  search: 'search',
  status: 'status',
  sort: 'sort',
  lengthMin: 'length_min',
  lengthMax: 'length_max',
  priceMin: 'price_min',
  priceMax: 'price_max',
  denomination: 'denomination',
  categories: 'categories',
  // Type filters
  typeLetters: 'type_letters',
  typeDigits: 'type_digits',
  typeEmojis: 'type_emojis',
  typeRepeating: 'type_repeating',
  // Market filters
  marketListed: 'market_listed',
  marketHasOffers: 'market_has_offers',
  marketHasSale: 'market_has_sale',
  marketplace: 'marketplace',
  // Text match filters
  contains: 'contains',
  startsWith: 'starts_with',
  endsWith: 'ends_with',
  // Text non-match filters
  notContains: 'not_contains',
  notStartsWith: 'not_starts_with',
  notEndsWith: 'not_ends_with',
  // Offer range filters
  offerMin: 'offer_min',
  offerMax: 'offer_max',
  // Watchers count filters
  watchersMin: 'watchers_min',
  watchersMax: 'watchers_max',
  // View count filters
  viewsMin: 'views_min',
  viewsMax: 'views_max',
  // Clubs count filters (categories count)
  categoriesCountMin: 'categories_count_min',
  categoriesCountMax: 'categories_count_max',
  // Activity type filters
  activityType: 'activity_type',
  // Creation date filters
  creationDateMin: 'creation_date_min',
  creationDateMax: 'creation_date_max',
  // Categories page filters
  catType: 'cat_type',
  catSort: 'cat_sort',
  catDir: 'cat_dir',
} as const

// Tabs that have locked status (status is implied by the tab)
const TABS_WITH_LOCKED_STATUS: Record<string, string> = {
  premium: 'Premium',
  available: 'Available',
  grace: 'Grace',
}

// Tabs that have locked market.Listed filter
const TABS_WITH_LOCKED_LISTED = ['listings']

// Base filter state structure (common across all filter types)
export interface BaseFilterState {
  search: string
  status: string[]
  market: MarketFiltersState
  type: TypeFiltersState
  textMatch: TextMatchFiltersState
  textNonMatch: TextNonMatchFiltersState
  length: { min: number | null; max: number | null }
  denomination: string
  priceRange: { min: number | null; max: number | null }
  offerRange: { min: number | null; max: number | null }
  watchersCount: { min: number | null; max: number | null }
  viewCount: { min: number | null; max: number | null }
  clubsCount: { min: number | null; max: number | null }
  creationDate: { min: string | null; max: string | null }
  categories: string[]
  sort: string | null
}

// Partial filter state from URL (all fields optional)
export interface ParsedUrlFilters {
  tab?: string
  search?: string
  status?: string[]
  sort?: string
  length?: { min: number | null; max: number | null }
  priceRange?: { min: number | null; max: number | null }
  offerRange?: { min: number | null; max: number | null }
  watchersCount?: { min: number | null; max: number | null }
  viewCount?: { min: number | null; max: number | null }
  clubsCount?: { min: number | null; max: number | null }
  creationDate?: { min: string | null; max: string | null }
  denomination?: string
  categories?: string[]
  type?: Partial<TypeFiltersState>
  market?: Partial<MarketFiltersState>
  textMatch?: Partial<TextMatchFiltersState>
  textNonMatch?: Partial<TextNonMatchFiltersState>
  activityType?: string[] // Activity type filters for activity tabs
  // Categories page filters
  catType?: CategoriesPageTypeOption | null
  catSort?: CategoriesPageSortOption
  catDir?: CategoriesPageSortDirection
}

// Default empty filter state for comparison
const DEFAULT_EMPTY_FILTER_STATE: BaseFilterState = {
  search: '',
  status: [],
  market: { ...DEFAULT_MARKET_FILTERS_STATE },
  type: { ...DEFAULT_TYPE_FILTERS_STATE },
  textMatch: { ...DEFAULT_TEXT_MATCH_FILTERS_STATE },
  textNonMatch: { ...DEFAULT_TEXT_NON_MATCH_FILTERS_STATE },
  length: { min: null, max: null },
  denomination: PRICE_DENOMINATIONS[0],
  priceRange: { min: null, max: null },
  offerRange: { min: null, max: null },
  watchersCount: { min: null, max: null },
  viewCount: { min: null, max: null },
  clubsCount: { min: null, max: null },
  creationDate: { min: null, max: null },
  categories: [],
  sort: null,
}

/**
 * Check if status should be skipped for this tab (tab implies the status)
 */
function shouldSkipStatusForTab(tab: string | undefined, status: string[]): boolean {
  if (!tab) return false
  const lockedStatus = TABS_WITH_LOCKED_STATUS[tab]
  // Skip if status is exactly the locked status for this tab
  return lockedStatus !== undefined && status.length === 1 && status[0] === lockedStatus
}

/**
 * Check if Listed filter should be skipped for this tab
 */
function shouldSkipListedForTab(tab: string | undefined, listedValue: string): boolean {
  if (!tab) return false
  // Skip if tab is 'listings' and Listed is 'yes'
  return TABS_WITH_LOCKED_LISTED.includes(tab) && listedValue === 'yes'
}

/**
 * Serialize filters and tab to URL search params string
 * Only includes non-default values to keep URL clean
 */
export function serializeFiltersToUrl(
  filters: BaseFilterState,
  tab: string | undefined,
  defaultTab: string,
  emptyFilterState: BaseFilterState = DEFAULT_EMPTY_FILTER_STATE
): string {
  const params = new URLSearchParams()

  // Tab (only if not default)
  if (tab && tab !== defaultTab) {
    params.set(URL_PARAMS.tab, tab)
  }

  // Search (skip if too long to avoid URL truncation with bulk search)
  if (filters.search && filters.search !== emptyFilterState.search && filters.search.length <= MAX_SEARCH_URL_LENGTH) {
    params.set(URL_PARAMS.search, filters.search)
  }

  // Status (array) - skip if tab implies this status
  if (
    (filters.status?.length ?? 0) > 0 &&
    JSON.stringify(filters.status) !== JSON.stringify(emptyFilterState.status) &&
    !shouldSkipStatusForTab(tab, filters.status)
  ) {
    params.set(URL_PARAMS.status, filters.status.join(','))
  }

  // Sort
  if (filters.sort && filters.sort !== emptyFilterState.sort) {
    params.set(URL_PARAMS.sort, filters.sort)
  }

  // Length
  if (filters.length.min !== null && filters.length.min !== emptyFilterState.length.min) {
    params.set(URL_PARAMS.lengthMin, String(filters.length.min))
  }
  if (filters.length.max !== null && filters.length.max !== emptyFilterState.length.max) {
    params.set(URL_PARAMS.lengthMax, String(filters.length.max))
  }

  // Price Range
  if (filters.priceRange.min !== null && filters.priceRange.min !== emptyFilterState.priceRange.min) {
    params.set(URL_PARAMS.priceMin, String(filters.priceRange.min))
  }
  if (filters.priceRange.max !== null && filters.priceRange.max !== emptyFilterState.priceRange.max) {
    params.set(URL_PARAMS.priceMax, String(filters.priceRange.max))
  }

  // Offer Range
  if (filters.offerRange?.min !== null && filters.offerRange?.min !== emptyFilterState.offerRange?.min) {
    params.set(URL_PARAMS.offerMin, String(filters.offerRange.min))
  }
  if (filters.offerRange?.max !== null && filters.offerRange?.max !== emptyFilterState.offerRange?.max) {
    params.set(URL_PARAMS.offerMax, String(filters.offerRange.max))
  }

  // Watchers Count
  if (filters.watchersCount?.min !== null && filters.watchersCount?.min !== emptyFilterState.watchersCount?.min) {
    params.set(URL_PARAMS.watchersMin, String(filters.watchersCount.min))
  }
  if (filters.watchersCount?.max !== null && filters.watchersCount?.max !== emptyFilterState.watchersCount?.max) {
    params.set(URL_PARAMS.watchersMax, String(filters.watchersCount.max))
  }

  // View Count
  if (filters.viewCount?.min !== null && filters.viewCount?.min !== emptyFilterState.viewCount?.min) {
    params.set(URL_PARAMS.viewsMin, String(filters.viewCount.min))
  }
  if (filters.viewCount?.max !== null && filters.viewCount?.max !== emptyFilterState.viewCount?.max) {
    params.set(URL_PARAMS.viewsMax, String(filters.viewCount.max))
  }

  // Clubs Count (Categories Count)
  if (filters.clubsCount?.min !== null && filters.clubsCount?.min !== emptyFilterState.clubsCount?.min) {
    params.set(URL_PARAMS.categoriesCountMin, String(filters.clubsCount.min))
  }
  if (filters.clubsCount?.max !== null && filters.clubsCount?.max !== emptyFilterState.clubsCount?.max) {
    params.set(URL_PARAMS.categoriesCountMax, String(filters.clubsCount.max))
  }

  // Creation Date
  if (filters.creationDate?.min && filters.creationDate.min !== emptyFilterState.creationDate?.min) {
    params.set(URL_PARAMS.creationDateMin, filters.creationDate.min)
  }
  if (filters.creationDate?.max && filters.creationDate.max !== emptyFilterState.creationDate?.max) {
    params.set(URL_PARAMS.creationDateMax, filters.creationDate.max)
  }

  // Denomination (only if not default)
  if (filters.denomination !== emptyFilterState.denomination) {
    params.set(URL_PARAMS.denomination, filters.denomination)
  }

  // Categories (array)
  if (
    filters.categories.length > 0 &&
    JSON.stringify(filters.categories) !== JSON.stringify(emptyFilterState.categories)
  ) {
    params.set(URL_PARAMS.categories, filters.categories.join(','))
  }

  // Type filters - handle both regular tabs (object) and activity tabs (array)
  const isActivityTab = tab === 'activity'

  // Activity type URL param is disabled for now - uncomment to re-enable
  // if (isActivityTab && Array.isArray((filters as any).type)) {
  //   // Activity tab: type is an array of activity types
  //   const activityTypes = (filters as any).type as string[]
  //   const defaultActivityTypes = (emptyFilterState as any).type as string[]
  //   // Only serialize if not all types are selected (which is the default)
  //   if (activityTypes.length !== defaultActivityTypes?.length ||
  //       !activityTypes.every((t: string) => defaultActivityTypes?.includes(t))) {
  //     params.set(URL_PARAMS.activityType, activityTypes.join(','))
  //   }
  // }

  if (!isActivityTab && filters.type) {
    // Regular tab: type is TypeFiltersState object
    if (filters.type.Letters !== emptyFilterState.type.Letters) {
      params.set(URL_PARAMS.typeLetters, filters.type.Letters)
    }
    if (filters.type.Digits !== emptyFilterState.type.Digits) {
      params.set(URL_PARAMS.typeDigits, filters.type.Digits)
    }
    if (filters.type.Emojis !== emptyFilterState.type.Emojis) {
      params.set(URL_PARAMS.typeEmojis, filters.type.Emojis)
    }
    if (filters.type.Repeating !== emptyFilterState.type.Repeating) {
      params.set(URL_PARAMS.typeRepeating, filters.type.Repeating)
    }
  }

  // Market filters (only non-default values) - skip for activity tabs
  if (!isActivityTab && filters.market) {
    // Skip Listed if tab implies it (e.g., 'listings' tab)
    if (
      filters.market.Listed !== emptyFilterState.market.Listed &&
      !shouldSkipListedForTab(tab, filters.market.Listed)
    ) {
      params.set(URL_PARAMS.marketListed, filters.market.Listed)
    }
    if (filters.market['Has Offers'] !== emptyFilterState.market['Has Offers']) {
      params.set(URL_PARAMS.marketHasOffers, filters.market['Has Offers'])
    }
    if (filters.market['Has Last Sale'] !== emptyFilterState.market['Has Last Sale']) {
      params.set(URL_PARAMS.marketHasSale, filters.market['Has Last Sale'])
    }
    if (filters.market.marketplace !== emptyFilterState.market.marketplace) {
      params.set(URL_PARAMS.marketplace, filters.market.marketplace)
    }
  }

  // Text match filters (only non-empty values) - skip for activity tabs
  if (!isActivityTab && filters.textMatch) {
    if (filters.textMatch.Contains && filters.textMatch.Contains !== emptyFilterState.textMatch.Contains) {
      params.set(URL_PARAMS.contains, filters.textMatch.Contains)
    }
    if (
      filters.textMatch['Starts with'] &&
      filters.textMatch['Starts with'] !== emptyFilterState.textMatch['Starts with']
    ) {
      params.set(URL_PARAMS.startsWith, filters.textMatch['Starts with'])
    }
    if (filters.textMatch['Ends with'] && filters.textMatch['Ends with'] !== emptyFilterState.textMatch['Ends with']) {
      params.set(URL_PARAMS.endsWith, filters.textMatch['Ends with'])
    }
  }

  // Text non-match filters (only non-empty values) - skip for activity tabs
  if (!isActivityTab && filters.textNonMatch) {
    if (
      filters.textNonMatch['Does not contain'] &&
      filters.textNonMatch['Does not contain'] !== emptyFilterState.textNonMatch['Does not contain']
    ) {
      params.set(URL_PARAMS.notContains, filters.textNonMatch['Does not contain'])
    }
    if (
      filters.textNonMatch['Does not start with'] &&
      filters.textNonMatch['Does not start with'] !== emptyFilterState.textNonMatch['Does not start with']
    ) {
      params.set(URL_PARAMS.notStartsWith, filters.textNonMatch['Does not start with'])
    }
    if (
      filters.textNonMatch['Does not end with'] &&
      filters.textNonMatch['Does not end with'] !== emptyFilterState.textNonMatch['Does not end with']
    ) {
      params.set(URL_PARAMS.notEndsWith, filters.textNonMatch['Does not end with'])
    }
  }

  return params.toString()
}

// Categories page filter state structure
export interface CategoriesPageFilterState {
  search: string
  type: CategoriesPageTypeOption | null
  sort: CategoriesPageSortOption
  sortDirection: CategoriesPageSortDirection
}

// Default empty categories page filter state
const DEFAULT_EMPTY_CATEGORIES_PAGE_FILTER_STATE: CategoriesPageFilterState = {
  search: '',
  type: null,
  sort: DEFAULT_CATEGORIES_PAGE_SORT,
  sortDirection: DEFAULT_CATEGORIES_PAGE_SORT_DIRECTION,
}

/**
 * Serialize categories page filters to URL search params string
 * Only includes non-default values to keep URL clean
 */
export function serializeCategoriesPageFiltersToUrl(
  filters: CategoriesPageFilterState,
  emptyFilterState: CategoriesPageFilterState = DEFAULT_EMPTY_CATEGORIES_PAGE_FILTER_STATE,
  tab?: string,
  defaultTab: string = 'categories'
): string {
  const params = new URLSearchParams()

  // Tab (only if not default)
  if (tab && tab !== defaultTab) {
    params.set(URL_PARAMS.tab, tab)
  }

  // Search (skip if too long to avoid URL truncation with bulk search)
  if (filters.search && filters.search !== emptyFilterState.search && filters.search.length <= MAX_SEARCH_URL_LENGTH) {
    params.set(URL_PARAMS.search, filters.search)
  }

  // Type (single value)
  if (filters.type && filters.type !== emptyFilterState.type) {
    params.set(URL_PARAMS.catType, filters.type)
  }

  // Sort
  if (filters.sort !== emptyFilterState.sort) {
    params.set(URL_PARAMS.catSort, filters.sort)
  }

  // Sort Direction
  if (filters.sortDirection !== emptyFilterState.sortDirection) {
    params.set(URL_PARAMS.catDir, filters.sortDirection)
  }

  return params.toString()
}

/**
 * Parse URL search params into filter state
 * Returns partial filter state - only includes values present in URL
 */
export function deserializeFiltersFromUrl(searchParams: URLSearchParams): ParsedUrlFilters {
  const result: ParsedUrlFilters = {}

  // Tab
  const tab = searchParams.get(URL_PARAMS.tab)
  if (tab) {
    result.tab = tab
  }

  // Search
  const search = searchParams.get(URL_PARAMS.search)
  if (search) {
    result.search = search
  }

  // Status (comma-separated array)
  const status = searchParams.get(URL_PARAMS.status)
  if (status) {
    result.status = status.split(',').filter(Boolean)
  }

  // Sort
  const sort = searchParams.get(URL_PARAMS.sort)
  if (sort) {
    result.sort = sort
  }

  // Length
  const lengthMin = searchParams.get(URL_PARAMS.lengthMin)
  const lengthMax = searchParams.get(URL_PARAMS.lengthMax)
  if (lengthMin !== null || lengthMax !== null) {
    result.length = {
      min: lengthMin ? Number(lengthMin) : null,
      max: lengthMax ? Number(lengthMax) : null,
    }
  }

  // Price Range
  const priceMin = searchParams.get(URL_PARAMS.priceMin)
  const priceMax = searchParams.get(URL_PARAMS.priceMax)
  if (priceMin !== null || priceMax !== null) {
    result.priceRange = {
      min: priceMin ? Number(priceMin) : null,
      max: priceMax ? Number(priceMax) : null,
    }
  }

  // Offer Range
  const offerMin = searchParams.get(URL_PARAMS.offerMin)
  const offerMax = searchParams.get(URL_PARAMS.offerMax)
  if (offerMin !== null || offerMax !== null) {
    result.offerRange = {
      min: offerMin ? Number(offerMin) : null,
      max: offerMax ? Number(offerMax) : null,
    }
  }

  // Watchers Count
  const watchersMin = searchParams.get(URL_PARAMS.watchersMin)
  const watchersMax = searchParams.get(URL_PARAMS.watchersMax)
  if (watchersMin !== null || watchersMax !== null) {
    result.watchersCount = {
      min: watchersMin ? Number(watchersMin) : null,
      max: watchersMax ? Number(watchersMax) : null,
    }
  }

  // View Count
  const viewsMin = searchParams.get(URL_PARAMS.viewsMin)
  const viewsMax = searchParams.get(URL_PARAMS.viewsMax)
  if (viewsMin !== null || viewsMax !== null) {
    result.viewCount = {
      min: viewsMin ? Number(viewsMin) : null,
      max: viewsMax ? Number(viewsMax) : null,
    }
  }

  // Clubs Count (Categories Count)
  const categoriesCountMin = searchParams.get(URL_PARAMS.categoriesCountMin)
  const categoriesCountMax = searchParams.get(URL_PARAMS.categoriesCountMax)
  if (categoriesCountMin !== null || categoriesCountMax !== null) {
    result.clubsCount = {
      min: categoriesCountMin ? Number(categoriesCountMin) : null,
      max: categoriesCountMax ? Number(categoriesCountMax) : null,
    }
  }

  // Creation Date
  const creationDateMin = searchParams.get(URL_PARAMS.creationDateMin)
  const creationDateMax = searchParams.get(URL_PARAMS.creationDateMax)
  if (creationDateMin !== null || creationDateMax !== null) {
    result.creationDate = {
      min: creationDateMin || null,
      max: creationDateMax || null,
    }
  }

  // Denomination
  const denomination = searchParams.get(URL_PARAMS.denomination)
  if (denomination) {
    result.denomination = denomination
  }

  // Categories (comma-separated array)
  const categories = searchParams.get(URL_PARAMS.categories)
  if (categories) {
    result.categories = categories.split(',').filter(Boolean)
  }

  // Type filters
  const typeLetters = searchParams.get(URL_PARAMS.typeLetters) as TypeFilterOption | null
  const typeDigits = searchParams.get(URL_PARAMS.typeDigits) as TypeFilterOption | null
  const typeEmojis = searchParams.get(URL_PARAMS.typeEmojis) as TypeFilterOption | null
  const typeRepeating = searchParams.get(URL_PARAMS.typeRepeating) as TypeFilterOption | null
  if (typeLetters || typeDigits || typeEmojis || typeRepeating) {
    result.type = {}
    if (typeLetters) result.type.Letters = typeLetters
    if (typeDigits) result.type.Digits = typeDigits
    if (typeEmojis) result.type.Emojis = typeEmojis
    if (typeRepeating) result.type.Repeating = typeRepeating
  }

  // Market filters
  const marketListed = searchParams.get(URL_PARAMS.marketListed) as MarketFilterOption | null
  const marketHasOffers = searchParams.get(URL_PARAMS.marketHasOffers) as MarketFilterOption | null
  const marketHasSale = searchParams.get(URL_PARAMS.marketHasSale) as MarketFilterOption | null
  const marketplace = searchParams.get(URL_PARAMS.marketplace) as MarketplaceOption | null
  if (marketListed || marketHasOffers || marketHasSale || marketplace) {
    result.market = {}
    if (marketListed) result.market.Listed = marketListed
    if (marketHasOffers) result.market['Has Offers'] = marketHasOffers
    if (marketHasSale) result.market['Has Last Sale'] = marketHasSale
    if (marketplace) result.market.marketplace = marketplace
  }

  // Text match filters
  const contains = searchParams.get(URL_PARAMS.contains)
  const startsWith = searchParams.get(URL_PARAMS.startsWith)
  const endsWith = searchParams.get(URL_PARAMS.endsWith)
  if (contains || startsWith || endsWith) {
    result.textMatch = {}
    if (contains) result.textMatch.Contains = contains
    if (startsWith) result.textMatch['Starts with'] = startsWith
    if (endsWith) result.textMatch['Ends with'] = endsWith
  }

  // Text non-match filters
  const notContains = searchParams.get(URL_PARAMS.notContains)
  const notStartsWith = searchParams.get(URL_PARAMS.notStartsWith)
  const notEndsWith = searchParams.get(URL_PARAMS.notEndsWith)
  if (notContains || notStartsWith || notEndsWith) {
    result.textNonMatch = {}
    if (notContains) result.textNonMatch['Does not contain'] = notContains
    if (notStartsWith) result.textNonMatch['Does not start with'] = notStartsWith
    if (notEndsWith) result.textNonMatch['Does not end with'] = notEndsWith
  }

  // Activity type URL param is disabled for now - uncomment to re-enable
  // const activityType = searchParams.get(URL_PARAMS.activityType)
  // if (activityType) {
  //   result.activityType = activityType.split(',').filter(Boolean)
  // }

  // Categories page filters
  const catType = searchParams.get(URL_PARAMS.catType) as CategoriesPageTypeOption | null
  if (catType) {
    result.catType = catType
  }

  const catSort = searchParams.get(URL_PARAMS.catSort) as CategoriesPageSortOption | null
  if (catSort) {
    result.catSort = catSort
  }

  const catDir = searchParams.get(URL_PARAMS.catDir) as CategoriesPageSortDirection | null
  if (catDir) {
    result.catDir = catDir
  }

  return result
}

/**
 * Get tab value from URL params with fallback to default
 */
export function getTabFromParams(searchParams: URLSearchParams, defaultTab: string): string {
  return searchParams.get(URL_PARAMS.tab) || defaultTab
}

/**
 * Check if URL has any filter params (excluding tab)
 */
export function hasFilterParams(searchParams: URLSearchParams): boolean {
  const filterKeys = Object.values(URL_PARAMS).filter((key) => key !== URL_PARAMS.tab)
  return filterKeys.some((key) => searchParams.has(key))
}
