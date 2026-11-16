import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Address, Hex } from 'viem'
import type { RootState } from '@/state'

export interface AnniversaryNftClaim {
  address: Address
  tokenId: number
  proof: Hex[]
}

interface AnniversaryNftModalState {
  open: boolean
  claim: AnniversaryNftClaim | null
}

const initialState: AnniversaryNftModalState = { open: false, claim: null }

const anniversaryNftSlice = createSlice({
  name: 'anniversaryNft',
  initialState,
  reducers: {
    openAnniversaryNftModal(state, { payload }: PayloadAction<AnniversaryNftClaim>) {
      state.open = true
      state.claim = payload
    },
    closeAnniversaryNftModal(state, { payload }: PayloadAction<Address | undefined>) {
      if (payload && state.claim?.address.toLowerCase() !== payload.toLowerCase()) return
      return initialState
    },
  },
})

export const { openAnniversaryNftModal, closeAnniversaryNftModal } = anniversaryNftSlice.actions
export const selectAnniversaryNftModal = (state: RootState) => state.modals.anniversaryNftReducer
export default anniversaryNftSlice.reducer
