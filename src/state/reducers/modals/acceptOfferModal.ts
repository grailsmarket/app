import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'

// Types --------------------------------------------
type AcceptOfferDomain = {
  domainName?: string | null
  price: number
  duration: number
  collectionId?: string | null
  tokenId: string
}

type AcceptOfferModalState = {
  open: boolean
  offer: AcceptOfferDomain | null
}

// Initial State ------------------------------------
const initialState: AcceptOfferModalState = {
  open: false,
  offer: null,
}

// Slice -------------------------------------------
export const AcceptOfferModalSlice = createSlice({
  name: 'AcceptOfferModal',
  initialState,
  reducers: {
    setAcceptOfferModalOpen(state, { payload }: PayloadAction<boolean>) {
      state.open = payload
    },
    setAcceptOfferModalOffer(state, { payload }: PayloadAction<AcceptOfferDomain | null>) {
      state.offer = payload
    },
  },
})

// Actions --------------------------------------------
export const { setAcceptOfferModalOpen, setAcceptOfferModalOffer } = AcceptOfferModalSlice.actions

// Selectors ------------------------------------------
export const selectAcceptOfferModal = (state: RootState) => state.modals.acceptOfferReducer

// Reducer --------------------------------------------
export default AcceptOfferModalSlice.reducer
