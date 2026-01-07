import { PayloadAction } from '@reduxjs/toolkit'
import { MarketplaceFiltersOpenedState } from '@/state/reducers/filters/marketplaceFilters'
import {
  ALL_SORT_FILTERS,
  MY_DOMAINS_FILTER_LABELS,
  MY_DOMAINS_OPENABLE_FILTERS,
  MY_DOMAINS_TYPE_FILTER_LABELS,
  MY_OFFERS_STATUS_FILTER_LABELS,
} from '@/constants/filters/portfolioFilters'
import {
  type TypeFiltersState,
  DEFAULT_TYPE_FILTERS_STATE,
  type MarketFiltersState,
  DEFAULT_MARKET_FILTERS_STATE,
  type TextMatchFiltersState,
  DEFAULT_TEXT_MATCH_FILTERS_STATE,
} from '@/constants/filters/marketplaceFilters'
import { PRICE_DENOMINATIONS } from '@/constants/filters'
import {
  ActivityFiltersOpenedState,
  ProfileActivityOpenableFilterType,
} from '@/state/reducers/filters/profileActivityFilters'
import { ProfileTabType } from '@/state/reducers/portfolio/profile'
import { MarketplaceTabType } from '@/state/reducers/marketplace/marketplace'

export type { TypeFiltersState, MarketFiltersState, TextMatchFiltersState }
export { DEFAULT_TYPE_FILTERS_STATE, DEFAULT_MARKET_FILTERS_STATE, DEFAULT_TEXT_MATCH_FILTERS_STATE }

// Internal types for common structures
export type LengthType = {
  min: number | null
  max: number | null
}

export type PriceType = {
  min: number | null
  max: number | null
}

export type FilterContextType = 'marketplace' | 'profile' | 'category'

export interface FilterRouterSelectors<T extends FilterContextType> {
  filters: T extends 'marketplace'
    ? MarketplaceFiltersOpenedState
    : T extends 'profile'
      ? ProfileFiltersOpenedState
      : PortfolioFiltersOpenedState
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
  setFiltersLength: (payload: LengthType) => PayloadAction<any>
  setPriceDenomination: (payload: any) => PayloadAction<any>
  setPriceRange: (payload: PriceType) => PayloadAction<any>
  toggleCategory: (payload: any) => PayloadAction<any>
  setFiltersCategory: (payload: any) => PayloadAction<any>
  setSort: (payload: any) => PayloadAction<any>
  toggleFilterOpen: (payload: any) => PayloadAction<any>
  clearFilters: () => PayloadAction<void>
}

export interface FilterRouter<T extends FilterContextType> {
  selectors: FilterRouterSelectors<T>
  actions: FilterRouterActions
  context: T
  profileTab?: ProfileTabType
  marketplaceTab?: MarketplaceTabType
  isFiltersClear: boolean
}

// Portfolio Filters Types
export type PortfolioStatusFilterType = (typeof MY_DOMAINS_FILTER_LABELS)[number]

export type PortfolioTypeFilterType = (typeof MY_DOMAINS_TYPE_FILTER_LABELS)[number]

export type PortfolioOpenableFilterType = (typeof MY_DOMAINS_OPENABLE_FILTERS)[number]

export type ProfileOffersStatusFilterType = (typeof MY_OFFERS_STATUS_FILTER_LABELS)[number]

export type ProfileDomainsStatusFilterType = (typeof MY_DOMAINS_FILTER_LABELS)[number]

export type PriceDenominationType = (typeof PRICE_DENOMINATIONS)[number]

export type SortFilterType = (typeof ALL_SORT_FILTERS)[number]

export type PortfolioFiltersState = {
  search: string
  status: PortfolioStatusFilterType[]
  market: MarketFiltersState
  type: TypeFiltersState
  textMatch: TextMatchFiltersState
  length: LengthType
  denomination: PriceDenominationType
  priceRange: PriceType
  categories: string[]
  sort: SortFilterType | null
}

export type PortfolioFiltersOpenedState = PortfolioFiltersState & {
  openFilters: PortfolioOpenableFilterType[]
  open: boolean
  scrollTop: number
}

export type ProfileFiltersOpenedState = ActivityFiltersOpenedState & {
  openFilters: ProfileActivityOpenableFilterType[]
}
