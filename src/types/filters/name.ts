import { PayloadAction } from '@reduxjs/toolkit'
import {
  NAME_STATUS_FILTER_LABELS,
  MARKETPLACE_TYPE_FILTER_LABELS,
  SORT_TYPES,
  SORT_LISTING_FILTERS,
  TEXT_NON_MATCH_FILTER_LABELS,
  TYPE_FILTER_OPTIONS,
  MARKET_FILTER_LABELS,
  MARKET_FILTER_OPTIONS,
  MARKETPLACE_OPTIONS,
  TEXT_MATCH_FILTER_LABELS,
  ALL_SORT_FILTERS,
} from '@/constants/filters/name'
import { PRICE_DENOMINATIONS } from '@/constants/filters'
import { ProfileTabType } from '@/state/reducers/portfolio/profile'
import { MarketplaceTabType } from '@/state/reducers/marketplace/marketplace'
import { CategoryTabType } from '@/state/reducers/category/category'
import { CategoriesPageTabType } from '@/constants/categories/categoriesPageTabs'

export type StatusType = (typeof NAME_STATUS_FILTER_LABELS)[number]

export type TypeFilterLabel = (typeof MARKETPLACE_TYPE_FILTER_LABELS)[number]

export type LengthType = {
  min: number | null
  max: number | null
}

export type PriceType = {
  min: number | null
  max: number | null
}

export type OfferType = {
  min: number | null
  max: number | null
}

export type WatchersCountType = {
  min: number | null
  max: number | null
}

export type ViewCountType = {
  min: number | null
  max: number | null
}

export type ClubsCountType = {
  min: number | null
  max: number | null
}

export type PriceDenominationType = (typeof PRICE_DENOMINATIONS)[number]

export type SortFilterType = (typeof ALL_SORT_FILTERS)[number]
export type SortType = (typeof SORT_TYPES)[number]
export type SortListingFilter = (typeof SORT_LISTING_FILTERS)[number]

export type TextNonMatchFilterLabel = (typeof TEXT_NON_MATCH_FILTER_LABELS)[number]
export type TextNonMatchFiltersState = Record<TextNonMatchFilterLabel, string>

export type MarketplaceTypeFilterLabel = (typeof MARKETPLACE_TYPE_FILTER_LABELS)[number]

export type TypeFilterOption = (typeof TYPE_FILTER_OPTIONS)[number]

export type TypeFiltersState = Record<MarketplaceTypeFilterLabel, TypeFilterOption>

export type MarketFilterLabel = (typeof MARKET_FILTER_LABELS)[number]

export type MarketFilterOption = (typeof MARKET_FILTER_OPTIONS)[number]

export type MarketplaceOption = (typeof MARKETPLACE_OPTIONS)[number]

export type MarketFiltersState = Record<MarketFilterLabel, MarketFilterOption> & {
  marketplace: MarketplaceOption
}
export type TextMatchFilterLabel = (typeof TEXT_MATCH_FILTER_LABELS)[number]

export type TextMatchFiltersState = Record<TextMatchFilterLabel, string>

export type NameFilters = {
  search: string
  status: StatusType[]
  market: MarketFiltersState
  type: TypeFiltersState
  textMatch: TextMatchFiltersState
  textNonMatch: TextNonMatchFiltersState
  length: LengthType
  denomination: PriceDenominationType
  priceRange: PriceType
  offerRange: OfferType
  watchersCount: WatchersCountType
  viewCount: ViewCountType
  clubsCount: ClubsCountType
  creationDate: { min: string | null; max: string | null }
  categories: string[]
  sort: SortFilterType | null
}

export type NamefiltersOpened = NameFilters & {
  open: boolean
  scrollTop: number
}

export type FilterContextType = 'marketplace' | 'profile' | 'category' | 'categoriesPage'

export interface FilterRouterSelectors {
  filters: NamefiltersOpened
}

export interface FilterRouterActions {
  setScrollTop: (payload: number) => PayloadAction<number>
  setFiltersOpen: (payload: boolean) => PayloadAction<boolean>
  setSearch: (payload: string) => PayloadAction<string>
  toggleFiltersStatus: (payload: any) => PayloadAction<any>
  setFiltersStatus: (payload: any) => PayloadAction<any>
  toggleFiltersType: (payload: any) => PayloadAction<any>
  setFiltersType: (payload: any) => PayloadAction<any>
  setMarketFilters: (payload: MarketFiltersState) => PayloadAction<MarketFiltersState>
  setTextMatchFilters: (payload: TextMatchFiltersState) => PayloadAction<TextMatchFiltersState>
  setTextNonMatchFilters: (payload: TextNonMatchFiltersState) => PayloadAction<TextNonMatchFiltersState>
  setFiltersLength: (payload: LengthType) => PayloadAction<any>
  setPriceDenomination: (payload: any) => PayloadAction<any>
  setPriceRange: (payload: PriceType) => PayloadAction<any>
  setOfferRange: (payload: OfferType) => PayloadAction<any>
  setWatchersCount: (payload: WatchersCountType) => PayloadAction<any>
  setViewCount: (payload: ViewCountType) => PayloadAction<any>
  setClubsCount: (payload: ClubsCountType) => PayloadAction<any>
  setCreationDate?: (payload: { min: string | null; max: string | null }) => PayloadAction<any>
  toggleCategory: (payload: any) => PayloadAction<any>
  setFiltersCategory: (payload: any) => PayloadAction<any>
  setSort: (payload: any) => PayloadAction<any>
  toggleFilterOpen: (payload: any) => PayloadAction<any>
  clearFilters: () => PayloadAction<void>
  addCategories: (payload: string[]) => PayloadAction<string[]>
  removeCategories: (payload: string[]) => PayloadAction<string[]>
}

export interface FilterRouter {
  selectors: FilterRouterSelectors
  actions: FilterRouterActions
  context: FilterContextType
  profileTab?: ProfileTabType
  marketplaceTab?: MarketplaceTabType
  categoryTab?: CategoryTabType
  categoriesPageTab?: CategoriesPageTabType
  activeTab?: string
  isFiltersClear: boolean
}
