import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'

export type TransferDomainType = {
  name: string
  tokenId: string
  owner?: string | null
  isWrapped?: boolean
  expiry_date?: string | null
}

type TransferModalState = {
  open: boolean
  domains: TransferDomainType[]
  canAddDomains: boolean
}

const initialState: TransferModalState = {
  open: false,
  domains: [],
  canAddDomains: false,
}

export const TransferModalSlice = createSlice({
  name: 'TransferModal',
  initialState,
  reducers: {
    setTransferModalOpen(state, { payload }: PayloadAction<boolean>) {
      state.open = payload
    },
    setTransferModalCanAddDomains(state, { payload }: PayloadAction<boolean>) {
      state.canAddDomains = payload
    },
    addTransferModalDomain(state, { payload }: PayloadAction<TransferDomainType>) {
      state.domains = [...state.domains, payload]
    },
    removeTransferModalDomain(state, { payload }: PayloadAction<TransferDomainType>) {
      state.domains = state.domains.filter((domain) => domain.name !== payload.name)
    },
    setTransferModalDomains(state, { payload }: PayloadAction<TransferDomainType[]>) {
      state.domains = payload
    },
  },
})

export const {
  setTransferModalOpen,
  setTransferModalDomains,
  addTransferModalDomain,
  removeTransferModalDomain,
  setTransferModalCanAddDomains,
} = TransferModalSlice.actions
export const selectTransferModal = (state: RootState) => state.modals.transferReducer
export default TransferModalSlice.reducer
