import { PayloadAction, createSlice } from '@reduxjs/toolkit'
import { RootState } from '../../index'
import { Address } from 'viem'

export type RegistrationFlowState = 'review' | 'committing' | 'waiting' | 'registering' | 'success' | 'error'

export interface RegistrationModalState {
  name: string | null
  isOpen: boolean
  flowState: RegistrationFlowState
  secret: Address | null
  commitmentHash: string | null
  commitmentTimestamp: number | null
  commitTxHash: string | null
  registerTxHash: string | null
  errorMessage: string | null
}

const initialState: RegistrationModalState = {
  name: null,
  isOpen: false,
  flowState: 'review',
  secret: null,
  commitmentHash: null,
  commitmentTimestamp: null,
  commitTxHash: null,
  registerTxHash: null,
  errorMessage: null,
}

const registrationModalSlice = createSlice({
  name: 'registrationModal',
  initialState,
  reducers: {
    openRegistrationModal: (state, action: PayloadAction<{ name: string }>) => {
      state.name = action.payload.name
      state.isOpen = true
      state.flowState = 'review'
      state.commitmentHash = null
      state.commitmentTimestamp = null
      state.commitTxHash = null
      state.registerTxHash = null
      state.errorMessage = null
    },
    closeRegistrationModal: (state) => {
      state.isOpen = false
    },
    setRegistrationFlowState: (state, action: PayloadAction<RegistrationFlowState>) => {
      state.flowState = action.payload
    },
    setCommitmentData: (state, action: PayloadAction<{ hash: string; timestamp: number }>) => {
      state.commitmentHash = action.payload.hash
      state.commitmentTimestamp = action.payload.timestamp
    },
    setSecret: (state, action: PayloadAction<Address>) => {
      state.secret = action.payload
    },
    setCommitTxHash: (state, action: PayloadAction<string>) => {
      state.commitTxHash = action.payload
    },
    setRegisterTxHash: (state, action: PayloadAction<string>) => {
      state.registerTxHash = action.payload
    },
    setRegistrationError: (state, action: PayloadAction<string>) => {
      state.errorMessage = action.payload
      state.flowState = 'error'
    },
    resetRegistrationModal: () => {
      return initialState
    },
  },
})

export const {
  openRegistrationModal,
  closeRegistrationModal,
  setRegistrationFlowState,
  setCommitmentData,
  setSecret,
  setCommitTxHash,
  setRegisterTxHash,
  setRegistrationError,
  resetRegistrationModal,
} = registrationModalSlice.actions

export const selectRegistrationModal = (state: RootState) => state.modals.registrationReducer

export default registrationModalSlice.reducer
