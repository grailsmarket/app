import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'

// Types --------------------------------------------
export type TransferTokenType = {
  tokenId: string
  collectionId: string | null
  domainName: string
}

type TransferTokenModalState = {
  open: boolean
  token: TransferTokenType | null
  toAddr: string
}

// Initial State ------------------------------------
const initialState: TransferTokenModalState = {
  open: false,
  token: null,
  toAddr: '',
}

// Slice -------------------------------------------
export const TransferTokenModalSlice = createSlice({
  name: 'TransferTokenModal',
  initialState,
  reducers: {
    setTransferTokenModalOpen(state, { payload }: PayloadAction<boolean>) {
      state.open = payload
    },
    setTransferTokenModalToken(state, { payload }: PayloadAction<TransferTokenType | null>) {
      state.token = payload
    },
    setTransferTokenModalToAddr(state, { payload }: PayloadAction<string>) {
      state.toAddr = payload
    },
    clearTokenTransferModal(state) {
      state.open = false
    },
  },
})

// Actions --------------------------------------------
export const {
  setTransferTokenModalOpen,
  setTransferTokenModalToken,
  setTransferTokenModalToAddr,
  clearTokenTransferModal,
} = TransferTokenModalSlice.actions

// Selectors ------------------------------------------
export const selectTransferTokenModal = (state: RootState) => state.modals.transferTokenReducer

// Reducer --------------------------------------------
export default TransferTokenModalSlice.reducer
