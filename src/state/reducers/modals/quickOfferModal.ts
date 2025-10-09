import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'
import { DurationType } from '../domains/marketplaceDomains'
import { MarketplaceDomainType } from '@/types/domains'

// Types --------------------------------------------
type QuickOfferModalState = {
  open: boolean
  domain: MarketplaceDomainType | null
  price: number | undefined
  duration: DurationType
}

// Initial State ------------------------------------
const initialState: QuickOfferModalState = {
  open: false,
  domain: null,
  price: undefined,
  duration: {
    value: undefined,
    units: 'Week',
  },
}

// Slice -------------------------------------------
export const QuickOfferModalSlice = createSlice({
  name: 'QuickOfferModal',
  initialState,
  reducers: {
    setQuickOfferModalOpen(state, { payload }: PayloadAction<boolean>) {
      state.open = payload
    },
    setQuickOfferModalDomain(state, { payload }: PayloadAction<MarketplaceDomainType | null>) {
      state.domain = payload
    },
    setQuickOfferModalPrice(state, { payload }: PayloadAction<number | undefined>) {
      state.price = payload
    },
    setQuickOfferModalDuration(state, { payload }: PayloadAction<DurationType>) {
      state.duration = payload
    },
  },
})

// Actions --------------------------------------------
export const { setQuickOfferModalOpen, setQuickOfferModalDomain, setQuickOfferModalPrice, setQuickOfferModalDuration } =
  QuickOfferModalSlice.actions

// Selectors ------------------------------------------
export const selectQuickOfferModal = (state: RootState) => state.modals.quickOfferReducer

// Reducer --------------------------------------------
export default QuickOfferModalSlice.reducer
