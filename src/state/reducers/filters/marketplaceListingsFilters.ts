import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'
import {
  DEFAULT_TYPE_FILTERS_STATE,
  DEFAULT_MARKET_FILTERS_STATE,
  DEFAULT_TEXT_MATCH_FILTERS_STATE,
  DEFAULT_TEXT_NON_MATCH_FILTERS_STATE,
  TypeFiltersState,
  TypeFilterOption,
  MarketplaceTypeFilterLabel,
  MarketFiltersState,
  TextMatchFiltersState,
  TextNonMatchFiltersState,
} from '@/constants/filters/marketplaceFilters'
import { PRICE_DENOMINATIONS } from '@/constants/filters'
import {
  MarketplaceStatusFilterType,
  MarketplaceLengthType,
  MarketplacePriceType,
  MarketplaceOfferType,
  MarketplaceWatchersCountType,
  MarketplaceViewCountType,
  MarketplaceClubsCountType,
  PriceDenominationType,
  MarketplaceOpenableFilterType,
  SortFilterType,
  MarketplaceFiltersState,
  MarketplaceFiltersOpenedState,
} from './marketplaceFilters'

// Default market filters state with Listed: 'yes'
const LISTINGS_MARKET_FILTERS_STATE: MarketFiltersState = {
  ...DEFAULT_MARKET_FILTERS_STATE,
  Listed: 'yes',
}

export const emptyFilterState: MarketplaceFiltersState = {
  search: '',
  status: [],
  market: { ...LISTINGS_MARKET_FILTERS_STATE },
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
  offerRange: {
    min: null,
    max: null,
  },
  watchersCount: {
    min: null,
    max: null,
  },
  viewCount: {
    min: null,
    max: null,
  },
  clubsCount: {
    min: null,
    max: null,
  },
  categories: [],
  sort: null,
}

// Initial State ------------------------------------
export const initialState: MarketplaceFiltersOpenedState = {
  open: false,
  search: '',
  status: ['Registered'],
  market: { ...LISTINGS_MARKET_FILTERS_STATE },
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
  offerRange: {
    min: null,
    max: null,
  },
  watchersCount: {
    min: null,
    max: null,
  },
  viewCount: {
    min: null,
    max: null,
  },
  clubsCount: {
    min: null,
    max: null,
  },
  categories: [],
  openFilters: [
    'Sort',
    'Status',
    'Market',
    'Type',
    'Text Match',
    'Text Non-Match',
    'Length',
    'Price Range',
    'Offer',
    'Watchers',
    'Views',
    'Categories Count',
  ],
  sort: null,
  scrollTop: 0,
}

// Slice -------------------------------------------
export const marketplaceListingsFiltersSlice = createSlice({
  name: 'marketplaceListingsFilters',
  initialState,
  reducers: {
    setFiltersOpen(state, { payload }: PayloadAction<boolean>) {
      state.open = payload
    },
    toggleFiltersStatus(state, { payload }: PayloadAction<MarketplaceStatusFilterType>) {
      if (state.status.includes(payload)) {
        state.status = state.status.filter((status) => status !== payload)
      } else {
        state.status.push(payload)
      }
    },
    setFiltersStatus(state, { payload }: PayloadAction<MarketplaceStatusFilterType>) {
      state.status = [payload]
    },
    setTypeFilter(state, { payload }: PayloadAction<{ label: MarketplaceTypeFilterLabel; option: TypeFilterOption }>) {
      const { label, option } = payload
      if (option === 'only') {
        state.type = { ...DEFAULT_TYPE_FILTERS_STATE, [label]: 'only' }
      } else {
        state.type[label] = option
      }
    },
    toggleFiltersType(state, { payload }: PayloadAction<MarketplaceTypeFilterLabel>) {
      state.type[payload] = state.type[payload] === 'include' ? 'exclude' : 'include'
    },
    setFiltersType(state, { payload }: PayloadAction<TypeFiltersState>) {
      state.type = payload
    },
    setMarketFilters(state, { payload }: PayloadAction<MarketFiltersState>) {
      // Always keep Listed as 'yes'
      state.market = { ...payload, Listed: 'yes' }
    },
    setTextMatchFilters(state, { payload }: PayloadAction<TextMatchFiltersState>) {
      state.textMatch = payload
    },
    setTextNonMatchFilters(state, { payload }: PayloadAction<TextNonMatchFiltersState>) {
      state.textNonMatch = payload
    },
    setFiltersLength(state, { payload }: PayloadAction<MarketplaceLengthType>) {
      state.length = payload
    },
    setPriceDenomination(state, { payload }: PayloadAction<PriceDenominationType>) {
      state.priceRange = { min: null, max: null }
      state.denomination = payload
    },
    setPriceRange(state, { payload }: PayloadAction<MarketplacePriceType>) {
      state.priceRange = payload
    },
    setOfferRange(state, { payload }: PayloadAction<MarketplaceOfferType>) {
      state.offerRange = payload
    },
    setWatchersCount(state, { payload }: PayloadAction<MarketplaceWatchersCountType>) {
      state.watchersCount = payload
    },
    setViewCount(state, { payload }: PayloadAction<MarketplaceViewCountType>) {
      state.viewCount = payload
    },
    setClubsCount(state, { payload }: PayloadAction<MarketplaceClubsCountType>) {
      state.clubsCount = payload
    },
    toggleCategory(state, { payload }: PayloadAction<string>) {
      const isFilterIncludesPayload = state.categories.includes(payload)
      if (isFilterIncludesPayload) {
        state.categories = state.categories.filter((category) => category !== payload)
      } else {
        state.categories.push(payload)
      }
    },
    setFiltersCategory(state, { payload }: PayloadAction<string>) {
      state.categories = [payload]
    },
    addCategories(state, { payload }: PayloadAction<string[]>) {
      payload.forEach((category) => {
        if (!state.categories.includes(category)) {
          state.categories.push(category)
        }
      })
    },
    removeCategories(state, { payload }: PayloadAction<string[]>) {
      state.categories = state.categories.filter((category) => !payload.includes(category))
    },
    setSort(state, { payload }: PayloadAction<SortFilterType | null>) {
      state.sort = payload
    },
    setSearch(state, { payload }: PayloadAction<string>) {
      state.search = payload
    },
    setFiltersScrollTop(state, { payload }: PayloadAction<number>) {
      state.scrollTop = payload
    },
    toggleFilterOpen(state, { payload }: PayloadAction<MarketplaceOpenableFilterType>) {
      const index = state.openFilters.findIndex((openFilter) => openFilter === payload)
      if (index > -1) {
        state.openFilters.splice(index, 1)
      } else {
        state.openFilters.push(payload)
      }
    },
    clearFilters(state) {
      state.search = ''
      state.status = []
      state.market = { ...LISTINGS_MARKET_FILTERS_STATE }
      state.type = { ...DEFAULT_TYPE_FILTERS_STATE }
      state.textMatch = { ...DEFAULT_TEXT_MATCH_FILTERS_STATE }
      state.textNonMatch = { ...DEFAULT_TEXT_NON_MATCH_FILTERS_STATE }
      state.length = { min: null, max: null }
      state.denomination = PRICE_DENOMINATIONS[0]
      state.priceRange = { min: null, max: null }
      state.offerRange = { min: null, max: null }
      state.watchersCount = { min: null, max: null }
      state.viewCount = { min: null, max: null }
      state.clubsCount = { min: null, max: null }
      state.categories = []
      state.openFilters = [
        'Sort',
        'Status',
        'Market',
        'Type',
        'Text Match',
        'Text Non-Match',
        'Length',
        'Price Range',
        'Offer',
        'Watchers',
        'Views',
        'Categories Count',
      ]
      state.sort = null
    },
  },
})

// Actions --------------------------------------------
export const {
  setFiltersOpen,
  toggleFiltersStatus,
  setFiltersStatus,
  setTypeFilter,
  toggleFiltersType,
  setFiltersType,
  setMarketFilters,
  setTextMatchFilters,
  setTextNonMatchFilters,
  setFiltersLength,
  setPriceDenomination,
  setPriceRange,
  setOfferRange,
  setWatchersCount,
  setViewCount,
  setClubsCount,
  toggleCategory,
  setFiltersCategory,
  addCategories,
  removeCategories,
  setSort,
  setSearch,
  setFiltersScrollTop,
  toggleFilterOpen,
  clearFilters,
} = marketplaceListingsFiltersSlice.actions

// Selectors ------------------------------------------
export const selectMarketplaceListingsFilters = (state: RootState) => state.filters.marketplaceListingsFilters

// Reducer --------------------------------------------
export default marketplaceListingsFiltersSlice.reducer
