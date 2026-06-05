import type { FEED_TABS } from '@/constants/filters/feed'
import type { ActivityTypeFilterType } from './activity'
import type { MarketFiltersState, MarketplaceOption, PriceType } from './name'

export type FeedKind = 'activity' | 'comment'

export type FeedTab = (typeof FEED_TABS)[number]
export type FeedTabValue = FeedTab['value']

export type FeedFiltersState = {
  selectedTab: FeedTab
  categories: string[]
  market: MarketFiltersState & { marketplace: MarketplaceOption }
  type: ActivityTypeFilterType[]
  search: string
  price: PriceType
}

export type FeedFiltersOpenedState = FeedFiltersState & {
  open: boolean
  scrollTop: number
}
