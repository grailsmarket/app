import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'
import { DomainOfferType } from '@/types/domains'

// Types --------------------------------------------
type CancelOfferModalState = {
  open: boolean
  offer: DomainOfferType | null
  name: string | null
}

// Initial State ------------------------------------
const initialState: CancelOfferModalState = {
  open: false,
  offer: null,
  name: null,
}

// Slice -------------------------------------------
export const CancelOfferModalSlice = createSlice({
  name: 'CancelOfferModal',
  initialState,
  reducers: {
    setCancelOfferModalOpen(state, { payload }: PayloadAction<boolean>) {
      state.open = payload
    },
    setCancelOfferModalOffer(state, { payload }: PayloadAction<DomainOfferType | null>) {
      state.offer = payload
    },
    setCancelOfferModalName(state, { payload }: PayloadAction<string | null>) {
      state.name = payload
    },
  },
})

// Actions --------------------------------------------
export const { setCancelOfferModalOpen, setCancelOfferModalOffer, setCancelOfferModalName } =
  CancelOfferModalSlice.actions

// Selectors ------------------------------------------
export const selectCancelOfferModal = (state: RootState) => state.modals.cancelOfferReducer

// Reducer --------------------------------------------
export default CancelOfferModalSlice.reducer
