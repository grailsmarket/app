import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'

// Types --------------------------------------------
export type CancelListingListing = {
  id: number
  name: string
  price: string
  currency: string
  expires: string
  source: string
}

type CancelListingModalState = {
  open: boolean
  listings: CancelListingListing[]
}

// Initial State ------------------------------------
const initialState: CancelListingModalState = {
  open: false,
  listings: [],
}

// Slice -------------------------------------------
export const CancelListingModalSlice = createSlice({
  name: 'CancelListingModal',
  initialState,
  reducers: {
    setCancelListingModalOpen(state, { payload }: PayloadAction<boolean>) {
      state.open = payload
    },
    setCancelListingModalListings(state, { payload }: PayloadAction<CancelListingListing[]>) {
      state.listings = payload
    },
  },
})

// Actions --------------------------------------------
export const { setCancelListingModalOpen, setCancelListingModalListings } = CancelListingModalSlice.actions

// Selectors ------------------------------------------
export const selectCancelListingModal = (state: RootState) => state.modals.cancelListingReducer

// Reducer --------------------------------------------
export default CancelListingModalSlice.reducer
