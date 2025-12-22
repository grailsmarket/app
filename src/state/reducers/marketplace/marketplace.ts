import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { MARKETPLACE_TABS } from '@/constants/domains/marketplace/tabs'
import { RootState } from '../../index'

// Types --------------------------------------------
export type MarketplaceTabType = (typeof MARKETPLACE_TABS)[number]

type MarketplaceState = {
  selectedTab: MarketplaceTabType
}

// Initial State ------------------------------------
const initialState: MarketplaceState = {
  selectedTab: MARKETPLACE_TABS[0],
}

// Slice -------------------------------------------
export const marketplaceSlice = createSlice({
  name: 'marketplace',
  initialState,
  reducers: {
    changeMarketplaceTab(state, { payload }: PayloadAction<MarketplaceTabType>) {
      state.selectedTab = payload
    },
    resetMarketplaceState(state) {
      state.selectedTab = MARKETPLACE_TABS[0]
    },
  },
})

// Actions --------------------------------------------
export const { changeMarketplaceTab, resetMarketplaceState } = marketplaceSlice.actions

// Selectors ------------------------------------------
export const selectMarketplace = (state: RootState) => state.marketplace.marketplace

// Reducer --------------------------------------------
export default marketplaceSlice.reducer
