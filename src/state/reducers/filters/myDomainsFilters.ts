import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'
import { PRICE_DENOMINATIONS } from '@/constants/filters'
import {
  PortfolioFiltersState,
  PortfolioFiltersOpenedState,
  PortfolioStatusFilterType,
  PortfolioTypeFilterType,
  PortfolioOpenableFilterType,
  SortFilterType,
  PriceDenominationType,
  PriceType,
  LengthType,
  TypeFiltersState,
} from '@/types/filters'
import {
  DEFAULT_TYPE_FILTERS_STATE,
  DEFAULT_MARKET_FILTERS_STATE,
  DEFAULT_TEXT_MATCH_FILTERS_STATE,
  DEFAULT_TEXT_NON_MATCH_FILTERS_STATE,
  TypeFilterOption,
  MarketplaceTypeFilterLabel,
  MarketFiltersState,
  TextMatchFiltersState,
  TextNonMatchFiltersState,
} from '@/constants/filters/marketplaceFilters'

export const emptyFilterState: PortfolioFiltersState = {
  search: '',
  status: [],
  market: { ...DEFAULT_MARKET_FILTERS_STATE },
  type: { ...DEFAULT_TYPE_FILTERS_STATE },
  textMatch: { ...DEFAULT_TEXT_MATCH_FILTERS_STATE },
  textNonMatch: { ...DEFAULT_TEXT_NON_MATCH_FILTERS_STATE },
  length: {
    min: null,
    max: null,
  },
  denomination: PRICE_DENOMINATIONS[0],
  priceRange: {
    min: null,
    max: null,
  },
  categories: [],
  sort: null,
}

// Initial State ------------------------------------
export const initialState: PortfolioFiltersOpenedState = {
  // Filters are only expandable on mobile and tablet, so this value will get ignored on desktop
  open: false,
  search: '',
  status: [],
  market: { ...DEFAULT_MARKET_FILTERS_STATE },
  type: { ...DEFAULT_TYPE_FILTERS_STATE },
  textMatch: { ...DEFAULT_TEXT_MATCH_FILTERS_STATE },
  textNonMatch: { ...DEFAULT_TEXT_NON_MATCH_FILTERS_STATE },
  length: {
    min: null,
    max: null,
  },
  denomination: PRICE_DENOMINATIONS[0],
  priceRange: {
    min: null,
    max: null,
  },
  categories: [],
  openFilters: ['Sort', 'Status', 'Market', 'Type', 'Text Match', 'Text Non-Match', 'Length', 'Price Range'],
  sort: 'expiry_date_asc',
  scrollTop: 0,
}

export type MyDomainsFiltersType = PortfolioFiltersState & {
  name: string
}

// Slice -------------------------------------------
export const myDomainsFiltersSlice = createSlice({
  name: 'myDomainsFilters',
  initialState,
  reducers: {
    setMyDomainsFiltersOpen(state, { payload }: PayloadAction<boolean>) {
      state.open = payload
    },
    toggleMyDomainsFiltersStatus(state, { payload }: PayloadAction<PortfolioStatusFilterType>) {
      const index = state.status.findIndex((_status) => _status === payload)
      if (index > -1) {
        state.status.splice(index, 1)
      } else {
        state.status.push(payload)
      }
    },
    setMyDomainsFiltersStatus(state, { payload }: PayloadAction<PortfolioStatusFilterType>) {
      state.status = [payload]
    },
    setMyDomainsTypeFilter(
      state,
      { payload }: PayloadAction<{ label: MarketplaceTypeFilterLabel; option: TypeFilterOption }>
    ) {
      const { label, option } = payload
      if (option === 'only') {
        state.type = { ...DEFAULT_TYPE_FILTERS_STATE, [label]: 'only' }
      } else {
        state.type[label] = option
      }
    },
    toggleMyDomainsFiltersType(state, { payload }: PayloadAction<MarketplaceTypeFilterLabel>) {
      state.type[payload] = state.type[payload] === 'include' ? 'exclude' : 'include'
    },
    setMyDomainsFiltersType(state, { payload }: PayloadAction<TypeFiltersState>) {
      state.type = payload
    },
    setMyDomainsMarketFilters(state, { payload }: PayloadAction<MarketFiltersState>) {
      state.market = payload
    },
    setMyDomainsTextMatchFilters(state, { payload }: PayloadAction<TextMatchFiltersState>) {
      state.textMatch = payload
    },
    setMyDomainsTextNonMatchFilters(state, { payload }: PayloadAction<TextNonMatchFiltersState>) {
      state.textNonMatch = payload
    },
    setMyDomainsFiltersLength(state, { payload }: PayloadAction<LengthType>) {
      state.length = payload
    },
    setMyDomainsPriceDenomination(state, { payload }: PayloadAction<PriceDenominationType>) {
      state.priceRange = { min: null, max: null }
      state.denomination = payload
    },
    setMyDomainsPriceRange(state, { payload }: PayloadAction<PriceType>) {
      state.priceRange = payload
    },
    toggleMyDomainsCategory(state, { payload }: PayloadAction<string>) {
      const isFilterIncludesPayload = state.categories.includes(payload)

      if (isFilterIncludesPayload) {
        state.categories = state.categories.filter((category) => category !== payload)
      } else {
        state.categories.push(payload)
      }
    },
    setMyDomainsFiltersCategory(state, { payload }: PayloadAction<string>) {
      state.categories = [payload]
    },
    setMyDomainsSort(state, { payload }: PayloadAction<SortFilterType | null>) {
      state.sort = payload
    },
    setMyDomainsSearch(state, { payload }: PayloadAction<string>) {
      state.search = payload
    },
    setMyDomainsScrollTop(state, { payload }: PayloadAction<number>) {
      state.scrollTop = payload
    },
    toggleMyDomainsFilterOpen(state, { payload }: PayloadAction<PortfolioOpenableFilterType>) {
      const index = state.openFilters.findIndex((openFilter) => openFilter === payload)
      if (index > -1) {
        state.openFilters.splice(index, 1)
      } else {
        state.openFilters.push(payload)
      }
    },
    clearMyDomainsFilters(state) {
      state.open = false
      state.search = ''
      state.status = []
      state.market = { ...DEFAULT_MARKET_FILTERS_STATE }
      state.type = { ...DEFAULT_TYPE_FILTERS_STATE }
      state.textMatch = { ...DEFAULT_TEXT_MATCH_FILTERS_STATE }
      state.textNonMatch = { ...DEFAULT_TEXT_NON_MATCH_FILTERS_STATE }
      state.length = {
        min: null,
        max: null,
      }
      state.denomination = PRICE_DENOMINATIONS[0]
      state.priceRange = {
        min: null,
        max: null,
      }
      state.categories = []
      state.openFilters = ['Sort', 'Status', 'Market', 'Type', 'Text Match', 'Text Non-Match', 'Length', 'Price Range']
      state.sort = null
    },
  },
})

// Actions --------------------------------------------
export const {
  setMyDomainsFiltersOpen,
  toggleMyDomainsFiltersStatus,
  setMyDomainsFiltersStatus,
  setMyDomainsTypeFilter,
  toggleMyDomainsFiltersType,
  setMyDomainsFiltersType,
  setMyDomainsMarketFilters,
  setMyDomainsTextMatchFilters,
  setMyDomainsTextNonMatchFilters,
  setMyDomainsFiltersLength,
  setMyDomainsPriceDenomination,
  setMyDomainsPriceRange,
  toggleMyDomainsCategory,
  setMyDomainsFiltersCategory,
  setMyDomainsSort,
  setMyDomainsSearch,
  setMyDomainsScrollTop,
  toggleMyDomainsFilterOpen,
  clearMyDomainsFilters,
} = myDomainsFiltersSlice.actions

// Selectors ------------------------------------------
export const selectMyDomainsFilters = (state: RootState) => state.filters.myDomainsFilters

// Reducer --------------------------------------------
export default myDomainsFiltersSlice.reducer
