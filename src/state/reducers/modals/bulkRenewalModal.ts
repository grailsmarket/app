import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'
import { MarketplaceDomainType } from '@/types/domains'

type BulkRenewalModalState = {
  open: boolean
  domains: MarketplaceDomainType[]
  canAddDomains: boolean
}

const initialState: BulkRenewalModalState = {
  open: false,
  domains: [],
  canAddDomains: false,
}

export const BulkRenewalModalSlice = createSlice({
  name: 'BulkRenewalModal',
  initialState,
  reducers: {
    setBulkRenewalModalOpen(state, { payload }: PayloadAction<boolean>) {
      state.open = payload
    },
    setBulkRenewalModalCanAddDomains(state, { payload }: PayloadAction<boolean>) {
      state.canAddDomains = payload
    },
    addBulkRenewalModalDomain(state, { payload }: PayloadAction<MarketplaceDomainType>) {
      state.domains = [...state.domains, payload]
    },
    removeBulkRenewalModalDomain(state, { payload }: PayloadAction<MarketplaceDomainType>) {
      state.domains = state.domains.filter((domain) => domain.name !== payload.name)
    },
    setBulkRenewalModalDomains(state, { payload }: PayloadAction<MarketplaceDomainType[]>) {
      state.domains = payload
    },
  },
})

export const {
  setBulkRenewalModalOpen,
  setBulkRenewalModalDomains,
  addBulkRenewalModalDomain,
  removeBulkRenewalModalDomain,
  setBulkRenewalModalCanAddDomains,
} = BulkRenewalModalSlice.actions
export const selectBulkRenewalModal = (state: RootState) => state.modals.bulkRenewalReducer
export default BulkRenewalModalSlice.reducer
