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
  listing: CancelListingListing | null
}

// Initial State ------------------------------------
const initialState: CancelListingModalState = {
  open: false,
  listing: null,
}

// Slice -------------------------------------------
export const CancelListingModalSlice = createSlice({
  name: 'CancelListingModal',
  initialState,
  reducers: {
    setCancelListingModalOpen(state, { payload }: PayloadAction<boolean>) {
      state.open = payload
    },
    setCancelListingModalListing(state, { payload }: PayloadAction<CancelListingListing | null>) {
      state.listing = payload
    },
  },
})

// Actions --------------------------------------------
export const { setCancelListingModalOpen, setCancelListingModalListing } = CancelListingModalSlice.actions

// Selectors ------------------------------------------
export const selectCancelListingModal = (state: RootState) => state.modals.cancelListingReducer

// Reducer --------------------------------------------
export default CancelListingModalSlice.reducer
