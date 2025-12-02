import { PayloadAction, createSlice } from '@reduxjs/toolkit'
import { RootState } from '../../index'
import { Address, Hex } from 'viem'
import { MarketplaceDomainType } from '@/types/domains'

export type RegistrationFlowState = 'review' | 'committing' | 'waiting' | 'registering' | 'success' | 'error'
export type RegistrationMode = 'register_for' | 'register_to'
export type TimeUnit = 'days' | 'weeks' | 'months' | 'years' | 'custom'

export interface RegistrationModalState {
  name: string | null
  domain: MarketplaceDomainType | null
  isOpen: boolean
  flowState: RegistrationFlowState
  secret: Address | null
  commitmentHash: Hex | null
  commitmentTimestamp: number | null
  commitTxHash: Hex | null
  registerTxHash: Hex | null
  errorMessage: string | null
  // New persisted fields
  registrationMode: RegistrationMode
  quantity: number
  timeUnit: TimeUnit
  customDuration: number
  calculatedDuration: string | null
  isNameAvailable: boolean | null
}

const initialState: RegistrationModalState = {
  name: null,
  domain: null,
  isOpen: false,
  flowState: 'review',
  secret: null,
  commitmentHash: null,
  commitmentTimestamp: null,
  commitTxHash: null,
  registerTxHash: null,
  errorMessage: null,
  registrationMode: 'register_for',
  quantity: 1,
  timeUnit: 'years',
  customDuration: 0,
  calculatedDuration: null,
  isNameAvailable: null,
}

const registrationSlice = createSlice({
  name: 'registration',
  initialState,
  reducers: {
    openRegistrationModal: (state, action: PayloadAction<{ name: string; domain: MarketplaceDomainType }>) => {
      state.name = action.payload.name
      state.domain = action.payload.domain
      state.isOpen = true
      // Don't reset other settings to allow resuming interrupted registrations
      if (state.flowState === 'success' || state.flowState === 'error') {
        state.flowState = 'review'
        state.commitmentHash = null
        state.commitmentTimestamp = null
        state.commitTxHash = null
        state.registerTxHash = null
        state.errorMessage = null
      }
      state.isNameAvailable = null // Always recheck availability for new/reopened name
    },
    closeRegistrationModal: (state) => {
      state.isOpen = false
    },
    setRegistrationFlowState: (state, action: PayloadAction<RegistrationFlowState>) => {
      state.flowState = action.payload
    },
    setCommitmentData: (state, action: PayloadAction<{ hash: Hex; timestamp: number }>) => {
      state.commitmentHash = action.payload.hash
      state.commitmentTimestamp = action.payload.timestamp
    },
    setSecret: (state, action: PayloadAction<Address>) => {
      state.secret = action.payload
    },
    setCommitTxHash: (state, action: PayloadAction<Hex>) => {
      state.commitTxHash = action.payload
    },
    setRegisterTxHash: (state, action: PayloadAction<Hex>) => {
      state.registerTxHash = action.payload
    },
    setRegistrationError: (state, action: PayloadAction<string>) => {
      state.errorMessage = action.payload
      state.flowState = 'error'
    },
    setRegistrationMode: (state, action: PayloadAction<RegistrationMode>) => {
      state.registrationMode = action.payload
    },
    setQuantity: (state, action: PayloadAction<number>) => {
      state.quantity = action.payload
    },
    setTimeUnit: (state, action: PayloadAction<TimeUnit>) => {
      state.timeUnit = action.payload
    },
    setCustomDuration: (state, action: PayloadAction<number>) => {
      state.customDuration = action.payload
    },
    setCalculatedDuration: (state, action: PayloadAction<string | null>) => {
      state.calculatedDuration = action.payload
    },
    setNameAvailable: (state, action: PayloadAction<boolean | null>) => {
      state.isNameAvailable = action.payload
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
  setRegistrationMode,
  setQuantity,
  setTimeUnit,
  setCustomDuration,
  setCalculatedDuration,
  setNameAvailable,
  resetRegistrationModal,
} = registrationSlice.actions

export const selectRegistration = (state: RootState) => state.registration

export default registrationSlice.reducer
