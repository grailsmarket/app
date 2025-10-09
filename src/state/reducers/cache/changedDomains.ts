import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'
import { MarketplaceDomainType } from '@/types/domains'

// Types --------------------------------------------
export type ChangedListedDataType = {
  name: string
  listing_price: string | null
  listing_expires: string | null
}

export type changedDomainsState = {
  changedListedDomains: ChangedListedDataType[]
  changedAcquiredDomains: MarketplaceDomainType[]
}
// Initial State ------------------------------------
export const initialState: changedDomainsState = {
  changedListedDomains: [],
  changedAcquiredDomains: [],
}

// Slice -------------------------------------------
export const changedDomainsSlice = createSlice({
  name: 'changedDomains',
  initialState,
  reducers: {
    setChangedListedDomains(state, { payload }: PayloadAction<ChangedListedDataType[]>) {
      state.changedListedDomains = payload
    },
    addChangedListedDomains(state, { payload }: PayloadAction<ChangedListedDataType[]>) {
      state.changedListedDomains = state.changedListedDomains.concat(payload)
    },
    removeChangedListedDomain(state, { payload }: PayloadAction<ChangedListedDataType>) {
      state.changedListedDomains = state.changedListedDomains.filter((d) => d.name !== payload.name)
    },
    setChangedAcquiredDomains(state, { payload }: PayloadAction<MarketplaceDomainType[]>) {
      state.changedAcquiredDomains = payload
    },
    addChangedAcquiredDomains(state, { payload }: PayloadAction<MarketplaceDomainType[]>) {
      state.changedAcquiredDomains = state.changedAcquiredDomains.concat(payload)
    },
    removeChangedAcquiredDomain(state, { payload }: PayloadAction<MarketplaceDomainType>) {
      state.changedAcquiredDomains = state.changedAcquiredDomains.filter((d) => d.name !== payload.name)
    },
  },
})

// Actions --------------------------------------------
export const {
  setChangedListedDomains,
  addChangedListedDomains,
  removeChangedListedDomain,
  setChangedAcquiredDomains,
  addChangedAcquiredDomains,
  removeChangedAcquiredDomain,
} = changedDomainsSlice.actions

// Selectors ------------------------------------------
export const selectChangedDomains = (state: RootState) => state.cache.changedDomains

// Reducer --------------------------------------------
export default changedDomainsSlice.reducer
