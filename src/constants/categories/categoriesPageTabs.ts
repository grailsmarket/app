export const CATEGORIES_PAGE_TABS = [
  {
    label: 'Categories',
    value: 'categories',
  },
  {
    label: 'Names',
    value: 'names',
  },
  {
    label: 'Premium',
    value: 'premium',
  },
  {
    label: 'Available',
    value: 'available',
  },
  {
    label: 'Holders',
    value: 'holders',
  },
] as const

export type CategoriesPageTabType = (typeof CATEGORIES_PAGE_TABS)[number]
