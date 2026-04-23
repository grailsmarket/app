export const BULK_SEARCH_TABS = [
  {
    label: 'Names',
    value: 'names',
  },
  {
    label: 'Registered',
    value: 'registered',
  },
  {
    label: 'Grace',
    value: 'grace',
  },
  {
    label: 'Premium',
    value: 'premium',
  },
  {
    label: 'Available',
    value: 'available',
  },
] as const

export type BulkSearchTabType = (typeof BULK_SEARCH_TABS)[number]
