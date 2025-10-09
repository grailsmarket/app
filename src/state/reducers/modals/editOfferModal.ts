import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'
import { DurationType } from '../domains/marketplaceDomains'

// Types --------------------------------------------
type EditOfferType = {
  name: string
  tokenId: string
  price: number | undefined
}

type EditOfferModalState = {
  open: boolean
  offer: EditOfferType | null
  duration: DurationType
}

// Initial State ------------------------------------
const initialState: EditOfferModalState = {
  open: false,
  offer: null,
  duration: {
    value: undefined,
    units: 'Week',
  },
}

// Slice -------------------------------------------
export const EditOfferModalSlice = createSlice({
  name: 'EditOfferModal',
  initialState,
  reducers: {
    setEditOfferModalOpen(state, { payload }: PayloadAction<boolean>) {
      state.open = payload
    },
    setEditOfferModalOffer(state, { payload }: PayloadAction<EditOfferType | null>) {
      state.offer = payload
    },
    setEditOfferModalPrice(state, { payload }: PayloadAction<number | undefined>) {
      if (!state.offer) return

      state.offer.price = payload
    },
    setEditOfferModalDuration(state, { payload }: PayloadAction<DurationType>) {
      state.duration = payload
    },
  },
})

// Actions --------------------------------------------
export const { setEditOfferModalOpen, setEditOfferModalOffer, setEditOfferModalPrice, setEditOfferModalDuration } =
  EditOfferModalSlice.actions

// Selectors ------------------------------------------
export const selectEditOfferModal = (state: RootState) => state.modals.editOfferReducer

// Reducer --------------------------------------------
export default EditOfferModalSlice.reducer
