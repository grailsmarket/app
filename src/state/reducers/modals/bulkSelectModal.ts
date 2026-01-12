import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'
import { DomainListingType, MarketplaceDomainType } from '@/types/domains'

type SelectAllState = {
  isLoading: boolean
  progress: { loaded: number; total: number } | null
  error: string | null
}

type BulkSelectState = {
  isSelecting: boolean
  domains: MarketplaceDomainType[]
  previousListings: DomainListingType[]
  selectAll: SelectAllState | null
}

const initialState: BulkSelectState = {
  isSelecting: false,
  domains: [],
  previousListings: [],
  selectAll: null,
}

export const BulkSelectSlice = createSlice({
  name: 'BulkSelect',
  initialState,
  reducers: {
    setBulkSelectIsSelecting(state, { payload }: PayloadAction<boolean>) {
      state.isSelecting = payload
    },
    addBulkSelectDomain(state, { payload }: PayloadAction<MarketplaceDomainType>) {
      const exists = state.domains.some((d) => d.name === payload.name)
      if (!exists) {
        state.domains.push(payload)
      }
    },
    removeBulkSelectDomain(state, { payload }: PayloadAction<MarketplaceDomainType>) {
      state.domains = state.domains.filter((d) => d.name !== payload.name)
    },
    setBulkSelectDomains(state, { payload }: PayloadAction<MarketplaceDomainType[]>) {
      state.domains = payload
    },
    addBulkSelectPreviousListing(state, { payload }: PayloadAction<DomainListingType>) {
      const exists = state.previousListings.some((l) => l.id === payload.id)
      if (!exists) {
        state.previousListings.push(payload)
      }
    },
    removeBulkSelectPreviousListing(state, { payload }: PayloadAction<DomainListingType>) {
      state.previousListings = state.previousListings.filter((l) => l.id !== payload.id)
    },
    setBulkSelectPreviousListings(state, { payload }: PayloadAction<DomainListingType[]>) {
      state.previousListings = payload
    },
    clearBulkSelect(state) {
      state.isSelecting = false
      state.domains = []
      state.previousListings = []
      state.selectAll = null
    },
    startSelectAll(state, { payload }: PayloadAction<{ total: number }>) {
      state.selectAll = {
        isLoading: true,
        progress: { loaded: 0, total: payload.total },
        error: null,
      }
    },
    updateSelectAllProgress(state, { payload }: PayloadAction<number>) {
      if (state.selectAll) {
        state.selectAll.progress = {
          ...state.selectAll.progress!,
          loaded: payload,
        }
      }
    },
    finishSelectAll(state) {
      state.selectAll = null
    },
    cancelSelectAll(state) {
      state.selectAll = null
    },
    setSelectAllError(state, { payload }: PayloadAction<string>) {
      if (state.selectAll) {
        state.selectAll.isLoading = false
        state.selectAll.error = payload
      }
    },
    clearSelectAllError(state) {
      if (state.selectAll) {
        state.selectAll.error = null
      }
      state.selectAll = null
    },
  },
})

export const {
  setBulkSelectIsSelecting,
  addBulkSelectDomain,
  removeBulkSelectDomain,
  setBulkSelectDomains,
  addBulkSelectPreviousListing,
  removeBulkSelectPreviousListing,
  setBulkSelectPreviousListings,
  clearBulkSelect,
  startSelectAll,
  updateSelectAllProgress,
  finishSelectAll,
  cancelSelectAll,
  setSelectAllError,
  clearSelectAllError,
} = BulkSelectSlice.actions

export const selectBulkSelect = (state: RootState) => state.modals.bulkSelectReducer

export default BulkSelectSlice.reducer
