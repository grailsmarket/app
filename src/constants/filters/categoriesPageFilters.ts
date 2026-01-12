// Categories Page Filters Constants

// Category type filter options
export const CATEGORIES_PAGE_TYPE_OPTIONS = ['ethmojis', 'digits', 'palindromes', 'prepunk', 'geo', 'letters'] as const

export type CategoriesPageTypeOption = (typeof CATEGORIES_PAGE_TYPE_OPTIONS)[number]

export const CATEGORIES_PAGE_TYPE_LABELS: Record<CategoriesPageTypeOption, string> = {
  ethmojis: 'Ethmojis',
  digits: 'Digits',
  palindromes: 'Palindromes',
  prepunk: 'Pre punk',
  geo: 'Geo',
  letters: 'Letters',
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
  'name',
] as const

export type CategoriesPageSortOption = (typeof CATEGORIES_PAGE_SORT_OPTIONS)[number]

export const CATEGORIES_PAGE_SORT_LABELS: Record<CategoriesPageSortOption, string> = {
  member_count: 'Name Count',
  total_sales_volume_wei: 'Total Volume',
  sales_volume_wei_1y: 'Volume (1Y)',
  sales_volume_wei_1mo: 'Volume (1M)',
  sales_volume_wei_1w: 'Volume (1W)',
  floor_price_wei: 'Floor Price',
  total_sales_count: 'Total Sales',
  sales_count_1y: 'Sales (1Y)',
  sales_count_1mo: 'Sales (1M)',
  sales_count_1w: 'Sales (1W)',
  name: 'Name',
}

// Sort direction
export type CategoriesPageSortDirection = 'asc' | 'desc'

// Default values
export const DEFAULT_CATEGORIES_PAGE_SORT: CategoriesPageSortOption = 'total_sales_volume_wei'
export const DEFAULT_CATEGORIES_PAGE_SORT_DIRECTION: CategoriesPageSortDirection = 'desc'

// Openable filters (for filter panel sections)
export const CATEGORIES_PAGE_OPENABLE_FILTERS = ['Type'] as const

export type CategoriesPageOpenableFilterType = (typeof CATEGORIES_PAGE_OPENABLE_FILTERS)[number]
