import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'
import { DomainListingType, MarketplaceDomainType } from '@/types/domains'

// Types --------------------------------------------
type MakeListingModalState = {
  open: boolean
  domains: MarketplaceDomainType[]
  previousListings: DomainListingType[]
  canAddDomains: boolean
}

// Initial State ------------------------------------
const initialState: MakeListingModalState = {
  open: false,
  domains: [],
  previousListings: [],
  canAddDomains: false,
}

// Slice -------------------------------------------
export const MakeListingModalSlice = createSlice({
  name: 'MakeListingModal',
  initialState,
  reducers: {
    setMakeListingModalOpen(state, { payload }: PayloadAction<boolean>) {
      state.open = payload
    },
    setMakeListingModalDomains(state, { payload }: PayloadAction<MarketplaceDomainType[]>) {
      state.domains = payload
    },
    addMakeListingModalDomain(state, { payload }: PayloadAction<MarketplaceDomainType>) {
      const exists = state.domains.some((d) => d.name === payload.name)
      if (!exists) {
        state.domains.push(payload)
      }
    },
    removeMakeListingModalDomain(state, { payload }: PayloadAction<MarketplaceDomainType>) {
      state.domains = state.domains.filter((d) => d.name !== payload.name)
    },
    setMakeListingModalPreviousListings(state, { payload }: PayloadAction<DomainListingType[]>) {
      state.previousListings = payload
    },
    addMakeListingModalPreviousListing(state, { payload }: PayloadAction<DomainListingType>) {
      state.previousListings.push(payload)
    },
    removeMakeListingModalPreviousListing(state, { payload }: PayloadAction<DomainListingType>) {
      state.previousListings = state.previousListings.filter((l) => l.id !== payload.id)
    },
    setMakeListingModalCanAddDomains(state, { payload }: PayloadAction<boolean>) {
      state.canAddDomains = payload
    },
  },
})

// Actions --------------------------------------------
export const {
  setMakeListingModalOpen,
  setMakeListingModalDomains,
  addMakeListingModalDomain,
  removeMakeListingModalDomain,
  setMakeListingModalPreviousListings,
  addMakeListingModalPreviousListing,
  removeMakeListingModalPreviousListing,
  setMakeListingModalCanAddDomains,
} = MakeListingModalSlice.actions

// Selectors ------------------------------------------
export const selectMakeListingModal = (state: RootState) => state.modals.makeListingReducer

// Reducer --------------------------------------------
export default MakeListingModalSlice.reducer
