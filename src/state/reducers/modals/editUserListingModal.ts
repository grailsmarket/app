import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'
import { DurationType } from '../domains/marketplaceDomains'
import { MarketplaceDomainType } from '@/types/domains'

// Types --------------------------------------------
type EditUserListingModalState = {
  open: boolean
  listing: MarketplaceDomainType | null
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
    setEditUserListingModalUserListing(state, { payload }: PayloadAction<MarketplaceDomainType | null>) {
      state.listing = payload
    },
    setEditUserListingModalPrice(state, { payload }: PayloadAction<number | undefined>) {
      if (!state.listing) return
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
