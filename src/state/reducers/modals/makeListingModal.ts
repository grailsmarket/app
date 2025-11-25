import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'
import { DomainListingType, MarketplaceDomainType } from '@/types/domains'

// Types --------------------------------------------
type MakeListingModalState = {
  open: boolean
  domain: MarketplaceDomainType | null
  previousListing: DomainListingType | null
}

// Initial State ------------------------------------
const initialState: MakeListingModalState = {
  open: false,
  domain: null,
  previousListing: null,
}

// Slice -------------------------------------------
export const MakeListingModalSlice = createSlice({
  name: 'MakeListingModal',
  initialState,
  reducers: {
    setMakeListingModalOpen(state, { payload }: PayloadAction<boolean>) {
      state.open = payload
    },
    setMakeListingModalDomain(state, { payload }: PayloadAction<MarketplaceDomainType | null>) {
      state.domain = payload
    },
    setMakeListingModalPreviousListing(state, { payload }: PayloadAction<DomainListingType | null>) {
      state.previousListing = payload
    },
  },
})

// Actions --------------------------------------------
export const { setMakeListingModalOpen, setMakeListingModalDomain, setMakeListingModalPreviousListing } =
  MakeListingModalSlice.actions

// Selectors ------------------------------------------
export const selectMakeListingModal = (state: RootState) => state.modals.makeListingReducer

// Reducer --------------------------------------------
export default MakeListingModalSlice.reducer
