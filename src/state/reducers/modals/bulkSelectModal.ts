import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'
import { DomainListingType, MarketplaceDomainType } from '@/types/domains'

type BulkSelectState = {
  isSelecting: boolean
  domains: MarketplaceDomainType[]
  previousListings: DomainListingType[]
}

const initialState: BulkSelectState = {
  isSelecting: false,
  domains: [],
  previousListings: [],
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
} = BulkSelectSlice.actions

export const selectBulkSelect = (state: RootState) => state.modals.bulkSelectReducer

export default BulkSelectSlice.reducer
