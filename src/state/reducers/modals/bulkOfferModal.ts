import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'
import { MarketplaceDomainType } from '@/types/domains'

type BulkOfferModalState = {
  open: boolean
  domains: MarketplaceDomainType[]
}

const initialState: BulkOfferModalState = {
  open: false,
  domains: [],
}

export const BulkOfferModalSlice = createSlice({
  name: 'BulkOfferModal',
  initialState,
  reducers: {
    setBulkOfferModalOpen(state, { payload }: PayloadAction<boolean>) {
      state.open = payload
    },
    setBulkOfferModalDomains(state, { payload }: PayloadAction<MarketplaceDomainType[]>) {
      state.domains = payload
    },
  },
})

export const { setBulkOfferModalOpen, setBulkOfferModalDomains } = BulkOfferModalSlice.actions
export const selectBulkOfferModal = (state: RootState) => state.modals.bulkOfferReducer
export default BulkOfferModalSlice.reducer
