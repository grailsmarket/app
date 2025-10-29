import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'
import { DomainListingType, MarketplaceDomainType } from '@/types/domains'

// Types --------------------------------------------
type BuyNowModalState = {
  open: boolean
  listing: DomainListingType | null
  domain: MarketplaceDomainType | null
}

// Initial State ------------------------------------
const initialState: BuyNowModalState = {
  open: false,
  listing: null,
  domain: null,
}

// Slice -------------------------------------------
export const BuyNowModalSlice = createSlice({
  name: 'BuyNowModal',
  initialState,
  reducers: {
    setBuyNowModalOpen(state, { payload }: PayloadAction<boolean>) {
      state.open = payload
    },
    setBuyNowModalListing(state, { payload }: PayloadAction<DomainListingType | null>) {
      state.listing = payload
    },
    setBuyNowModalDomain(state, { payload }: PayloadAction<MarketplaceDomainType | null>) {
      state.domain = payload
    },
  },
})

// Actions --------------------------------------------
export const { setBuyNowModalOpen, setBuyNowModalListing, setBuyNowModalDomain } = BuyNowModalSlice.actions

// Selectors ------------------------------------------
export const selectBuyNowModal = (state: RootState) => state.modals.buyNowReducer

// Reducer --------------------------------------------
export default BuyNowModalSlice.reducer
