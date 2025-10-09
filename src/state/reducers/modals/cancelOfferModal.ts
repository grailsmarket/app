import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'

// Types --------------------------------------------
type CancelOfferOfferType = {
  offerId: string
  domainName: string
  expires: number
  price: string
  asset: string
}

type CancelOfferModalState = {
  open: boolean
  offer: CancelOfferOfferType | null
}

// Initial State ------------------------------------
const initialState: CancelOfferModalState = {
  open: false,
  offer: null,
}

// Slice -------------------------------------------
export const CancelOfferModalSlice = createSlice({
  name: 'CancelOfferModal',
  initialState,
  reducers: {
    setCancelOfferModalOpen(state, { payload }: PayloadAction<boolean>) {
      state.open = payload
    },
    setCancelOfferModalOffer(state, { payload }: PayloadAction<CancelOfferOfferType | null>) {
      state.offer = payload
    },
  },
})

// Actions --------------------------------------------
export const { setCancelOfferModalOpen, setCancelOfferModalOffer } = CancelOfferModalSlice.actions

// Selectors ------------------------------------------
export const selectCancelOfferModal = (state: RootState) => state.modals.cancelOfferReducer

// Reducer --------------------------------------------
export default CancelOfferModalSlice.reducer
