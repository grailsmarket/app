import { SortDirection } from '@/types/filters'
import {
  CategoriesPageFiltersOpenedState,
  CategoriesPageFiltersState,
  CategoriesPageSortOption,
  CategoriesPageTypeOption,
} from '@/types/filters/categories'
import { PayloadAction } from '@reduxjs/toolkit'

// Category type filter options
export const CATEGORIES_PAGE_TYPE_OPTIONS = [
  'ethmojis',
  'digits',
  'palindromes',
  'prepunk',
  'geo',
  'letters',
  'fantasy',
  'crypto',
  'ai',
] as const

export const CATEGORIES_PAGE_TYPE_LABELS: Record<CategoriesPageTypeOption, string> = {
  ethmojis: 'Ethmojis',
  digits: 'Digits',
  palindromes: 'Palindromes',
  prepunk: 'Prepunk',
  geo: 'Geo',
  letters: 'Letters',
  fantasy: 'Fantasy',
  crypto: 'Crypto',
  ai: 'AI',
}

// Sort options for categories page
export const CATEGORIES_PAGE_SORT_OPTIONS = [
  'total_sales_volume_wei',
  'sales_volume_wei_1y',
  'sales_volume_wei_1mo',
  'sales_volume_wei_1w',
  'member_count',
  'registered_count',
  'registered_percent',
  'listings_count',
  'listings_percent',
  'grace_count',
  'grace_percent',
  'floor_price_wei',
  'total_sales_count',
  'sales_count_1y',
  'sales_count_1mo',
  'sales_count_1w',
  'total_reg_count',
  'reg_count_1y',
  'reg_count_1mo',
  'reg_count_1w',
  'total_reg_volume_wei',
  'reg_volume_wei_1y',
  'reg_volume_wei_1mo',
  'reg_volume_wei_1w',
  'premium_count',
  'available_count',
  'premium_percent',
  'available_percent',
  'holders_count',
  'holders_ratio',
  'name',
] as const

export const CATEGORIES_PAGE_SORT_LABELS: Record<CategoriesPageSortOption, string> = {
  total_sales_volume_wei: 'Volume (All Time)',
  sales_volume_wei_1y: 'Volume (1y)',
  sales_volume_wei_1mo: 'Volume (1mo)',
  sales_volume_wei_1w: 'Volume (1w)',
  member_count: 'Name Count',
  registered_count: 'Registered Count',
  registered_percent: 'Registered %',
  listings_count: 'Listings Count',
  listings_percent: 'Listings %',
  grace_count: 'Grace Count',
  grace_percent: 'Grace %',
  floor_price_wei: 'Floor Price',
  total_sales_count: 'Sales (All Time)',
  sales_count_1y: 'Sales (1y)',
  sales_count_1mo: 'Sales (1mo)',
  sales_count_1w: 'Sales (1w)',
  total_reg_count: 'Registrations (All Time)',
  reg_count_1y: 'Registrations (1y)',
  reg_count_1mo: 'Registrations (1mo)',
  reg_count_1w: 'Registrations (1w)',
  total_reg_volume_wei: 'Reg Volume (All Time)',
  reg_volume_wei_1y: 'Reg Volume (1y)',
  reg_volume_wei_1mo: 'Reg Volume (1mo)',
  reg_volume_wei_1w: 'Reg Volume (1w)',
  premium_count: 'Premium',
  available_count: 'Available',
  premium_percent: 'Premium %',
  available_percent: 'Available %',
  holders_count: 'Holders Count',
  holders_ratio: 'Holders Ratio',
  name: 'Alphabetical',
}

// Default values
export const DEFAULT_CATEGORIES_PAGE_SORT: CategoriesPageSortOption = 'sales_volume_wei_1mo'
export const DEFAULT_CATEGORIES_PAGE_SORT_DIRECTION: SortDirection = 'desc'

// Openable filters (for filter panel sections)
export const CATEGORIES_PAGE_OPENABLE_FILTERS = ['Type'] as const

export const DEFAULT_CATEGORIES_PAGE_FILTERS_STATE: CategoriesPageFiltersState = {
  search: '',
  type: null,
  sort: DEFAULT_CATEGORIES_PAGE_SORT,
  sortDirection: DEFAULT_CATEGORIES_PAGE_SORT_DIRECTION,
}

export const DEFAULT_CATEGORIES_PAGE_FILTERS_OPENED_STATE: CategoriesPageFiltersOpenedState = {
  ...DEFAULT_CATEGORIES_PAGE_FILTERS_STATE,
  open: false,
  scrollTop: 0,
}

export const setCategoriesPageFiltersOpen = (
  state: CategoriesPageFiltersOpenedState,
  { payload }: PayloadAction<boolean>
) => {
  state.open = payload
}

export const setCategoriesPageSearch = (
  state: CategoriesPageFiltersOpenedState,
  { payload }: PayloadAction<string>
) => {
  state.search = payload
}

export const toggleCategoriesPageType = (
  state: CategoriesPageFiltersOpenedState,
  { payload }: PayloadAction<CategoriesPageTypeOption>
) => {
  state.type = state.type === payload ? null : payload
}

export const setCategoriesPageType = (
  state: CategoriesPageFiltersOpenedState,
  { payload }: PayloadAction<CategoriesPageTypeOption | null>
) => {
  state.type = payload
}

export const setCategoriesPageSort = (
  state: CategoriesPageFiltersOpenedState,
  { payload }: PayloadAction<CategoriesPageSortOption>
) => {
  state.sort = payload
}

export const setCategoriesPageSortDirection = (
  state: CategoriesPageFiltersOpenedState,
  { payload }: PayloadAction<SortDirection>
) => {
  state.sortDirection = payload
}

export const setCategoriesPageScrollTop = (
  state: CategoriesPageFiltersOpenedState,
  { payload }: PayloadAction<number>
) => {
  state.scrollTop = payload
}

export const clearCategoriesPageFilters = (state: CategoriesPageFiltersOpenedState) => {
  state.search = ''
  state.type = null
  state.sort = DEFAULT_CATEGORIES_PAGE_SORT
  state.sortDirection = DEFAULT_CATEGORIES_PAGE_SORT_DIRECTION
}

export const CATEGORIES_PAGE_FILTERS_ACTIONS = {
  setCategoriesPageFiltersOpen,
  setCategoriesPageSearch,
  toggleCategoriesPageType,
  setCategoriesPageType,
  setCategoriesPageSort,
  setCategoriesPageSortDirection,
  setCategoriesPageScrollTop,
  clearCategoriesPageFilters,
}
