import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'
import { MarketplaceDomainType } from '@/types/domains'

// Types --------------------------------------------
type MakeOfferModalState = {
  open: boolean
  domain: MarketplaceDomainType | null
}

// Initial State ------------------------------------
const initialState: MakeOfferModalState = {
  open: false,
  domain: null,
}

// Slice -------------------------------------------
export const MakeOfferModalSlice = createSlice({
  name: 'MakeOfferModal',
  initialState,
  reducers: {
    setMakeOfferModalOpen(state, { payload }: PayloadAction<boolean>) {
      state.open = payload
    },
    setMakeOfferModalDomain(state, { payload }: PayloadAction<MarketplaceDomainType | null>) {
      state.domain = payload
    },
  },
})

// Actions --------------------------------------------
export const { setMakeOfferModalOpen, setMakeOfferModalDomain } = MakeOfferModalSlice.actions

// Selectors ------------------------------------------
export const selectMakeOfferModal = (state: RootState) => state.modals.makeOfferReducer

// Reducer --------------------------------------------
export default MakeOfferModalSlice.reducer
