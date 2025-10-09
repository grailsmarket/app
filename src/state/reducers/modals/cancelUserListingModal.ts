import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'

// Types --------------------------------------------
type CancelListingListing = {
  listingId: string
  domainName: string
  listedPrice: string
  asset: string
  expires: number
}

type CancelUserListingModalState = {
  open: boolean
  listing: CancelListingListing | null
}

// Initial State ------------------------------------
const initialState: CancelUserListingModalState = {
  open: false,
  listing: null,
}

// Slice -------------------------------------------
export const CancelUserListingModalSlice = createSlice({
  name: 'CancelUserListingModal',
  initialState,
  reducers: {
    setCancelUserListingModalOpen(state, { payload }: PayloadAction<boolean>) {
      state.open = payload
    },
    setCancelUserListingModalUserListing(state, { payload }: PayloadAction<CancelListingListing | null>) {
      state.listing = payload
    },
  },
})

// Actions --------------------------------------------
export const { setCancelUserListingModalOpen, setCancelUserListingModalUserListing } =
  CancelUserListingModalSlice.actions

// Selectors ------------------------------------------
export const selectCancelUserListingModal = (state: RootState) => state.modals.cancelUserListingReducer

// Reducer --------------------------------------------
export default CancelUserListingModalSlice.reducer
