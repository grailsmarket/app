// Categories Page Filters Constants

// Category type filter options
export const CATEGORIES_PAGE_TYPE_OPTIONS = ['ethmojis', 'digits', 'palindromes', 'prepunk', 'geo', 'letters', 'fantasy', 'crypto'] as const

export type CategoriesPageTypeOption = (typeof CATEGORIES_PAGE_TYPE_OPTIONS)[number]

export const CATEGORIES_PAGE_TYPE_LABELS: Record<CategoriesPageTypeOption, string> = {
  ethmojis: 'Ethmojis',
  digits: 'Digits',
  palindromes: 'Palindromes',
  prepunk: 'Prepunk',
  geo: 'Geo',
  letters: 'Letters',
  fantasy: 'Fantasy',
  crypto: 'Crypto'
}

// Sort options for categories page
export const CATEGORIES_PAGE_SORT_OPTIONS = [
  'total_sales_volume_wei',
  'sales_volume_wei_1y',
  'sales_volume_wei_1mo',
  'sales_volume_wei_1w',
  'member_count',
  'floor_price_wei',
  'total_sales_count',
  'sales_count_1y',
  'sales_count_1mo',
  'sales_count_1w',
  'premium_count',
  'available_count',
  'name',
] as const

export type CategoriesPageSortOption = (typeof CATEGORIES_PAGE_SORT_OPTIONS)[number]

export const CATEGORIES_PAGE_SORT_LABELS: Record<CategoriesPageSortOption, string> = {
  total_sales_volume_wei: 'Volume (All Time)',
  sales_volume_wei_1y: 'Volume (1y)',
  sales_volume_wei_1mo: 'Volume (1mo)',
  sales_volume_wei_1w: 'Volume (1w)',
  member_count: 'Name Count',
  floor_price_wei: 'Floor Price',
  total_sales_count: 'Sales (All Time)',
  sales_count_1y: 'Sales (1y)',
  sales_count_1mo: 'Sales (1mo)',
  sales_count_1w: 'Sales (1w)',
  premium_count: 'Premium',
  available_count: 'Available',
  name: 'Alphabetical',
}

// Sort direction
export type CategoriesPageSortDirection = 'asc' | 'desc'

// Default values
export const DEFAULT_CATEGORIES_PAGE_SORT: CategoriesPageSortOption = 'sales_volume_wei_1mo'
export const DEFAULT_CATEGORIES_PAGE_SORT_DIRECTION: CategoriesPageSortDirection = 'desc'

// Openable filters (for filter panel sections)
export const CATEGORIES_PAGE_OPENABLE_FILTERS = ['Type'] as const

export type CategoriesPageOpenableFilterType = (typeof CATEGORIES_PAGE_OPENABLE_FILTERS)[number]
