import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'
import { Listing } from '@/types/seaport'

// Types --------------------------------------------
type BuyNowModalState = {
  open: boolean
  listing: Listing | null
}

// Initial State ------------------------------------
const initialState: BuyNowModalState = {
  open: false,
  listing: null,
}

// Slice -------------------------------------------
export const BuyNowModalSlice = createSlice({
  name: 'BuyNowModal',
  initialState,
  reducers: {
    setBuyNowModalOpen(state, { payload }: PayloadAction<boolean>) {
      state.open = payload
    },
    setBuyNowModalListing(state, { payload }: PayloadAction<Listing | null>) {
      state.listing = payload
    },
  },
})

// Actions --------------------------------------------
export const { setBuyNowModalOpen, setBuyNowModalListing } = BuyNowModalSlice.actions

// Selectors ------------------------------------------
export const selectBuyNowModal = (state: RootState) => state.modals.buyNowReducer

// Reducer --------------------------------------------
export default BuyNowModalSlice.reducer
