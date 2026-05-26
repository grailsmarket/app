export const AI_SEARCH_TABS = [
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

export type AiSearchTabType = (typeof AI_SEARCH_TABS)[number]
