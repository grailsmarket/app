import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'
import { DomainsToListType } from '../tabs/manager'
import { DurationType } from '../domains/marketplaceDomains'

// Types --------------------------------------------
type EditUserListingModalState = {
  open: boolean
  listing: DomainsToListType | null
  duration: DurationType
}

// Initial State ------------------------------------
const initialState: EditUserListingModalState = {
  open: false,
  listing: null,
  duration: {
    value: undefined,
    units: 'Week',
  },
}

// Slice -------------------------------------------
export const EditUserListingModalSlice = createSlice({
  name: 'EditUserListingModal',
  initialState,
  reducers: {
    setEditUserListingModalOpen(state, { payload }: PayloadAction<boolean>) {
      state.open = payload
    },
    setEditUserListingModalUserListing(state, { payload }: PayloadAction<DomainsToListType | null>) {
      state.listing = payload
    },
    setEditUserListingModalPrice(state, { payload }: PayloadAction<number | undefined>) {
      if (!state.listing) return

      state.listing.price = payload
    },
    setEditUserListingModalDuration(state, { payload }: PayloadAction<DurationType>) {
      state.duration = payload
    },
  },
})

// Actions --------------------------------------------
export const {
  setEditUserListingModalOpen,
  setEditUserListingModalUserListing,
  setEditUserListingModalPrice,
  setEditUserListingModalDuration,
} = EditUserListingModalSlice.actions

// Selectors ------------------------------------------
export const selectEditUserListingModal = (state: RootState) => state.modals.editUserListingReducer

// Reducer --------------------------------------------
export default EditUserListingModalSlice.reducer
