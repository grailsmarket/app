import { PayloadAction, createSlice } from '@reduxjs/toolkit'
import { RootState } from '../../index'
import { Address, Hex } from 'viem'
import { MarketplaceDomainType } from '@/types/domains'

export type RegistrationFlowState = 'review' | 'committing' | 'waiting' | 'registering' | 'success' | 'error'
export type RegistrationMode = 'register_for' | 'register_to'
export type TimeUnit = 'days' | 'weeks' | 'months' | 'years' | 'custom'

const MAX_BATCH_SIZE = 100

// Duration override for each name (null fields = use base duration)
export interface NameRegistrationEntry {
  name: string
  domain: MarketplaceDomainType
  registrationMode: RegistrationMode | null
  quantity: number | null
  timeUnit: TimeUnit | null
  customDuration: number | null
  calculatedDuration: string | null
  isAvailable: boolean | null
}

// Batch tracking
export interface BatchState {
  batchIndex: number
  nameIndices: number[]
  commitmentHashes: Hex[] | null
  commitTxHash: Hex | null
  commitmentTimestamp: number | null
  registerTxHash: Hex | null
  committed: boolean
  registered: boolean
}

export interface RegistrationModalState {
  isOpen: boolean
  flowState: RegistrationFlowState
  secret: Address | null
  errorMessage: string | null
  entries: NameRegistrationEntry[]
  registrationMode: RegistrationMode
  quantity: number
  timeUnit: TimeUnit
  customDuration: number
  batches: BatchState[]
  currentBatchIndex: number
}

const initialState: RegistrationModalState = {
  isOpen: false,
  flowState: 'review',
  secret: null,
  errorMessage: null,
  entries: [],
  registrationMode: 'register_for',
  quantity: 1,
  timeUnit: 'years',
  customDuration: 0,
  batches: [],
  currentBatchIndex: 0,
}

function createDefaultEntry(name: string, domain: MarketplaceDomainType): NameRegistrationEntry {
  return {
    name,
    domain,
    registrationMode: null,
    quantity: null,
    timeUnit: null,
    customDuration: null,
    calculatedDuration: null,
    isAvailable: null,
  }
}

function computeBatches(entries: NameRegistrationEntry[]): BatchState[] {
  const availableIndices = entries.map((e, i) => (e.isAvailable !== false ? i : -1)).filter((i) => i !== -1)

  const batches: BatchState[] = []
  for (let i = 0; i < availableIndices.length; i += MAX_BATCH_SIZE) {
    const chunk = availableIndices.slice(i, i + MAX_BATCH_SIZE)
    batches.push({
      batchIndex: batches.length,
      nameIndices: chunk,
      commitmentHashes: null,
      commitTxHash: null,
      commitmentTimestamp: null,
      registerTxHash: null,
      committed: false,
      registered: false,
    })
  }
  return batches
}

const registrationSlice = createSlice({
  name: 'registration',
  initialState,
  reducers: {
    openRegistrationModal: (state, action: PayloadAction<{ name: string; domain: MarketplaceDomainType }>) => {
      const { name, domain } = action.payload

      // Check if reopening for same entries
      const isSameEntry = state.entries.length === 1 && state.entries[0].name === name

      if (!isSameEntry) {
        state.entries = [createDefaultEntry(name, domain)]
        state.batches = []
        state.currentBatchIndex = 0
      }

      state.isOpen = true

      if (state.flowState === 'success' || state.flowState === 'error') {
        state.flowState = 'review'
        state.batches = []
        state.currentBatchIndex = 0
        state.errorMessage = null
      }

      // Always recheck availability for reopened entries (could have changed since last check)
      if (!isSameEntry) {
        state.entries.forEach((e) => {
          e.isAvailable = null
        })
      }
    },
    openBulkRegistrationModal: (
      state,
      action: PayloadAction<{ entries: { name: string; domain: MarketplaceDomainType }[] }>
    ) => {
      state.entries = action.payload.entries.map((e) => createDefaultEntry(e.name, e.domain))
      state.isOpen = true
      state.flowState = 'review'
      state.secret = null
      state.errorMessage = null
      state.batches = []
      state.currentBatchIndex = 0
    },
    closeRegistrationModal: (state) => {
      state.isOpen = false
    },
    setRegistrationFlowState: (state, action: PayloadAction<RegistrationFlowState>) => {
      state.flowState = action.payload
    },
    setSecret: (state, action: PayloadAction<Address>) => {
      state.secret = action.payload
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
    // individual name duration overrides
    setEntryDuration: (
      state,
      action: PayloadAction<{
        index: number
        registrationMode: RegistrationMode
        quantity: number
        timeUnit: TimeUnit
        customDuration: number
      }>
    ) => {
      const { index, registrationMode, quantity, timeUnit, customDuration } = action.payload
      if (state.entries[index]) {
        state.entries[index].registrationMode = registrationMode
        state.entries[index].quantity = quantity
        state.entries[index].timeUnit = timeUnit
        state.entries[index].customDuration = customDuration
      }
    },
    clearEntryDuration: (state, action: PayloadAction<number>) => {
      const entry = state.entries[action.payload]
      if (entry) {
        entry.registrationMode = null
        entry.quantity = null
        entry.timeUnit = null
        entry.customDuration = null
        entry.calculatedDuration = null
      }
    },
    setEntryAvailability: (state, action: PayloadAction<{ index: number; available: boolean | null }>) => {
      const { index, available } = action.payload
      if (state.entries[index]) {
        state.entries[index].isAvailable = available
      }
    },

    setBulkAvailability: (state, action: PayloadAction<(boolean | null)[]>) => {
      action.payload.forEach((available, index) => {
        if (state.entries[index]) {
          state.entries[index].isAvailable = available
        }
      })
    },
    setEntryCalculatedDuration: (state, action: PayloadAction<{ index: number; duration: string | null }>) => {
      if (state.entries[action.payload.index]) {
        state.entries[action.payload.index].calculatedDuration = action.payload.duration
      }
    },
    initializeBatches: (state) => {
      state.batches = computeBatches(state.entries)
      state.currentBatchIndex = 0
    },
    setBatchCommitTxHash: (state, action: PayloadAction<{ batchIndex: number; txHash: Hex }>) => {
      const batch = state.batches[action.payload.batchIndex]
      if (batch) {
        batch.commitTxHash = action.payload.txHash
      }
    },
    setBatchCommitmentData: (
      state,
      action: PayloadAction<{ batchIndex: number; hashes: Hex[]; timestamp: number }>
    ) => {
      const batch = state.batches[action.payload.batchIndex]
      if (batch) {
        batch.commitmentHashes = action.payload.hashes
        batch.commitmentTimestamp = action.payload.timestamp
      }
    },
    setBatchCommitted: (state, action: PayloadAction<number>) => {
      const batch = state.batches[action.payload]
      if (batch) {
        batch.committed = true
      }
    },
    setBatchRegisterTxHash: (state, action: PayloadAction<{ batchIndex: number; txHash: Hex }>) => {
      const batch = state.batches[action.payload.batchIndex]
      if (batch) {
        batch.registerTxHash = action.payload.txHash
      }
    },
    setBatchRegistered: (state, action: PayloadAction<number>) => {
      const batch = state.batches[action.payload]
      if (batch) {
        batch.registered = true
      }
    },
    setCurrentBatchIndex: (state, action: PayloadAction<number>) => {
      state.currentBatchIndex = action.payload
    },
    resetRegistrationModal: () => {
      return initialState
    },
  },
})

export const {
  openRegistrationModal,
  openBulkRegistrationModal,
  closeRegistrationModal,
  setRegistrationFlowState,
  setSecret,
  setRegistrationError,
  setRegistrationMode,
  setQuantity,
  setTimeUnit,
  setCustomDuration,
  setEntryDuration,
  clearEntryDuration,
  setEntryAvailability,
  setBulkAvailability,
  setEntryCalculatedDuration,
  initializeBatches,
  setBatchCommitTxHash,
  setBatchCommitmentData,
  setBatchCommitted,
  setBatchRegisterTxHash,
  setBatchRegistered,
  setCurrentBatchIndex,
  resetRegistrationModal,
} = registrationSlice.actions

export const selectRegistration = (state: RootState) => state.registration

export default registrationSlice.reducer
