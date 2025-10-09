import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'
import { TransactionBannerStatusType } from '@/types/ui'

// Types --------------------------------------------
export type TransactionBannerOptions = {
  title: string | null
  message: string | null
  isInfoBox: boolean
  progress: number | null
  status: TransactionBannerStatusType | null
}

type TransactionBannerState = TransactionBannerOptions & {
  isVisible: boolean
}

// Initial State ------------------------------------
const initialState: TransactionBannerState = {
  isVisible: false,
  title: null,
  message: null,
  isInfoBox: false,
  progress: null,
  status: null,
}

// Slice -------------------------------------------
export const transactionBannerSlice = createSlice({
  name: 'transactionBanner',
  initialState,
  reducers: {
    setTransactionBannerIsVisible(state, { payload }: PayloadAction<boolean>) {
      state.isVisible = payload
    },
    setTransactionBannerTitle(state, { payload }: PayloadAction<string | null>) {
      state.title = payload
    },
    setTransactionBannerMessage(state, { payload }: PayloadAction<string | null>) {
      state.message = payload
    },
    setTransactionBannerIsInfoBox(state, { payload }: PayloadAction<boolean>) {
      state.isInfoBox = payload
    },
    setTransactionBannerProgress(state, { payload }: PayloadAction<number | null>) {
      state.progress = payload
    },
    setTransactionBannerStatus(state, { payload }: PayloadAction<TransactionBannerStatusType | null>) {
      state.status = payload
    },
  },
})

// Actions --------------------------------------------
export const {
  setTransactionBannerIsVisible,
  setTransactionBannerTitle,
  setTransactionBannerMessage,
  setTransactionBannerIsInfoBox,
  setTransactionBannerProgress,
  setTransactionBannerStatus,
} = transactionBannerSlice.actions

// Selectors ------------------------------------------
export const selectTransactionBanner = (state: RootState) => state.transactions.transactionBannerReducer

// Reducer --------------------------------------------
export default transactionBannerSlice.reducer
