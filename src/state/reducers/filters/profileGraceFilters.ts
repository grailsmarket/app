import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'
import { PRICE_DENOMINATIONS } from '@/constants/filters'
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
import {
  PortfolioFiltersOpenedState,
  PortfolioStatusFilterType,
  PortfolioOpenableFilterType,
  SortFilterType,
  PriceDenominationType,
  PriceType,
  LengthType,
  OfferType,
  WatchersCountType,
  ViewCountType,
  ClubsCountType,
  PortfolioFiltersState,
  TypeFiltersState,
} from '@/types/filters'

export const emptyFilterState: PortfolioFiltersState = {
  search: '',
  status: ['Grace'],
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

// Initial State
export const initialState: PortfolioFiltersOpenedState = {
  open: false,
  search: '',
  status: ['Grace'],
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
  sort: 'expiry_date_asc',
  scrollTop: 0,
}

// Slice
export const profileGraceFiltersSlice = createSlice({
  name: 'profileGraceFilters',
  initialState,
  reducers: {
    setFiltersOpen(state, { payload }: PayloadAction<boolean>) {
      state.open = payload
    },
    setSearch(state, { payload }: PayloadAction<string>) {
      state.search = payload
    },
    toggleFiltersStatus(state, { payload }: PayloadAction<PortfolioStatusFilterType>) {
      if (state.status.includes(payload)) {
        state.status = state.status.filter((status) => status !== payload)
      } else {
        state.status = state.status.concat(payload)
      }
    },
    setFiltersStatus(state, { payload }: PayloadAction<PortfolioStatusFilterType>) {
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
      state.market = payload
    },
    setProfileGraceTextMatchFilters(state, { payload }: PayloadAction<TextMatchFiltersState>) {
      state.textMatch = payload
    },
    setProfileGraceTextNonMatchFilters(state, { payload }: PayloadAction<TextNonMatchFiltersState>) {
      state.textNonMatch = payload
    },
    setFiltersLength(state, { payload }: PayloadAction<LengthType>) {
      state.length = payload
    },
    setPriceDenomination(state, { payload }: PayloadAction<PriceDenominationType>) {
      state.denomination = payload
      state.priceRange = { min: null, max: null }
    },
    setPriceRange(state, { payload }: PayloadAction<PriceType>) {
      state.priceRange = payload
    },
    setOfferRange(state, { payload }: PayloadAction<OfferType>) {
      state.offerRange = payload
    },
    setProfileGraceWatchersCount(state, { payload }: PayloadAction<WatchersCountType>) {
      state.watchersCount = payload
    },
    setProfileGraceViewCount(state, { payload }: PayloadAction<ViewCountType>) {
      state.viewCount = payload
    },
    setProfileGraceClubsCount(state, { payload }: PayloadAction<ClubsCountType>) {
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
    setFiltersScrollTop(state, { payload }: PayloadAction<number>) {
      state.scrollTop = payload
    },
    toggleFilterOpen(state, { payload }: PayloadAction<PortfolioOpenableFilterType>) {
      const index = state.openFilters.findIndex((filter) => filter === payload)
      if (index > -1) {
        state.openFilters.splice(index, 1)
      } else {
        state.openFilters.push(payload)
      }
    },
    clearFilters(state) {
      state.search = ''
      state.status = ['Grace']
      state.market = { ...DEFAULT_MARKET_FILTERS_STATE }
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

// Actions
export const {
  setFiltersOpen,
  setSearch,
  toggleFiltersStatus,
  setFiltersStatus,
  setTypeFilter,
  toggleFiltersType,
  setFiltersType,
  setMarketFilters,
  setProfileGraceTextMatchFilters,
  setProfileGraceTextNonMatchFilters,
  setFiltersLength,
  setPriceDenomination,
  setPriceRange,
  setOfferRange,
  setProfileGraceWatchersCount,
  setProfileGraceViewCount,
  setProfileGraceClubsCount,
  toggleCategory,
  setFiltersCategory,
  addCategories,
  removeCategories,
  setSort,
  setFiltersScrollTop,
  toggleFilterOpen,
  clearFilters,
} = profileGraceFiltersSlice.actions

// Selectors
export const selectProfileGraceFilters = (state: RootState) => state.filters.profileGraceFilters

// Reducer
export default profileGraceFiltersSlice.reducer
