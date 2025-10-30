import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'
import { DomainOfferType, MarketplaceDomainType } from '@/types/domains'

// Types --------------------------------------------
type AcceptOfferModalState = {
  open: boolean
  offer: DomainOfferType | null
  domain: MarketplaceDomainType | null
}

// Initial State ------------------------------------
const initialState: AcceptOfferModalState = {
  open: false,
  offer: null,
  domain: null,
}

// Slice -------------------------------------------
export const AcceptOfferModalSlice = createSlice({
  name: 'AcceptOfferModal',
  initialState,
  reducers: {
    setAcceptOfferModalOpen(state, { payload }: PayloadAction<boolean>) {
      state.open = payload
    },
    setAcceptOfferModalOffer(state, { payload }: PayloadAction<DomainOfferType | null>) {
      state.offer = payload
    },
    setAcceptOfferModalDomain(state, { payload }: PayloadAction<MarketplaceDomainType | null>) {
      state.domain = payload
    },
  },
})

// Actions --------------------------------------------
export const { setAcceptOfferModalOpen, setAcceptOfferModalOffer, setAcceptOfferModalDomain } =
  AcceptOfferModalSlice.actions

// Selectors ------------------------------------------
export const selectAcceptOfferModal = (state: RootState) => state.modals.acceptOfferReducer

// Reducer --------------------------------------------
export default AcceptOfferModalSlice.reducer
