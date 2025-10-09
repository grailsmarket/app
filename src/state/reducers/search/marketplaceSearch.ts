import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'

// Types --------------------------------------------
type MarketplaceSearchState = {
  searchTerm: string
  currentSearchTerm: string
  searchSimilar: boolean
  searchFloor: boolean
}

// Initial State ------------------------------------
const initialState: MarketplaceSearchState = {
  searchTerm: '',
  currentSearchTerm: '',
  searchSimilar: false,
  searchFloor: false,
}

// Slice -------------------------------------------
export const marketplaceSearchSlice = createSlice({
  name: 'marketplaceSearch',
  initialState,
  reducers: {
    setMarketplaceSearchTerm(state, { payload }: PayloadAction<string>) {
      state.searchTerm = payload
    },
    setMarketplaceCurrentSearchTerm(state, { payload }: PayloadAction<string>) {
      state.currentSearchTerm = payload
    },
    setMarketplaceSearchSimilar(state, { payload }: PayloadAction<boolean>) {
      state.searchSimilar = payload
    },
    setMarketplaceSearchFloor(state, { payload }: PayloadAction<boolean>) {
      state.searchFloor = payload
    },
    clearMarketplaceSearchTerm(state) {
      state.searchTerm = ''
      state.currentSearchTerm = ''
    },
  },
})

// Actions --------------------------------------------
export const {
  setMarketplaceSearchTerm,
  setMarketplaceCurrentSearchTerm,
  setMarketplaceSearchSimilar,
  setMarketplaceSearchFloor,
  clearMarketplaceSearchTerm,
} = marketplaceSearchSlice.actions

// Selectors ------------------------------------------
export const selectMarketplaceSearch = (state: RootState) => state.search.marketplaceSearch

// Reducer --------------------------------------------
export default marketplaceSearchSlice.reducer
