import { PayloadAction } from '@reduxjs/toolkit'
import { MarketplaceFiltersOpenedState } from '@/state/reducers/filters/marketplaceFilters'
import {
  ALL_SORT_FILTERS,
  MY_DOMAINS_CATEGORIES,
  MY_DOMAINS_FILTER_LABELS,
  MY_DOMAINS_OPENABLE_FILTERS,
  MY_DOMAINS_TYPE_FILTER_LABELS,
  MY_OFFERS_STATUS_FILTER_LABELS,
} from '@/constants/filters/portfolioFilters'
import { PRICE_DENOMINATIONS } from '@/constants/filters'

// Internal types for common structures
export type LengthType = {
  min: number | null
  max: number | null
}

export type PriceType = {
  min: number | null
  max: number | null
}

export type FilterContextType = 'marketplace' | 'portfolio'

export type PortfolioTabType = 'domains' | 'received_offers' | 'my_offers' | 'watchlist'

export interface FilterRouterSelectors<T extends FilterContextType> {
  filters: T extends 'marketplace' ? MarketplaceFiltersOpenedState : PortfolioFiltersOpenedState
}

export interface FilterRouterActions {
  setFiltersOpen: (payload: boolean) => PayloadAction<boolean>
  setSearch: (payload: string) => PayloadAction<string>
  toggleFiltersStatus: (payload: any) => PayloadAction<any>
  setFiltersStatus: (payload: any) => PayloadAction<any>
  toggleFiltersType: (payload: any) => PayloadAction<any>
  setFiltersType: (payload: any) => PayloadAction<any>
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
  portfolioTab?: PortfolioTabType
}

// Portfolio Filters Types
export type PortfolioStatusFilterType = (typeof MY_DOMAINS_FILTER_LABELS)[number]

export type PortfolioTypeFilterType = (typeof MY_DOMAINS_TYPE_FILTER_LABELS)[number]

export type PortfolioCategoryType = (typeof MY_DOMAINS_CATEGORIES)[number]

export type PortfolioOpenableFilterType = (typeof MY_DOMAINS_OPENABLE_FILTERS)[number]

export type ProfileOffersStatusFilterType = (typeof MY_OFFERS_STATUS_FILTER_LABELS)[number]

export type ProfileDomainsStatusFilterType = (typeof MY_DOMAINS_FILTER_LABELS)[number]

export type PriceDenominationType = (typeof PRICE_DENOMINATIONS)[number]

export type SortFilterType = (typeof ALL_SORT_FILTERS)[number]

export type PortfolioFiltersState = {
  open: boolean
  search: string
  status: PortfolioStatusFilterType[]
  type: PortfolioTypeFilterType[]
  length: LengthType
  denomination: PriceDenominationType
  priceRange: PriceType
  categoryObjects: PortfolioCategoryType[]
  sort: SortFilterType | null
}

export type PortfolioFiltersOpenedState = PortfolioFiltersState & {
  openFilters: PortfolioOpenableFilterType[]
}
