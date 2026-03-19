import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'

// Types --------------------------------------------
type UpgradeModalState = {
  open: boolean
}

// Initial State ------------------------------------
const initialState: UpgradeModalState = {
  open: false,
}

// Slice -------------------------------------------
export const UpgradeModalSlice = createSlice({
  name: 'UpgradeModal',
  initialState,
  reducers: {
    setUpgradeModalOpen(state, { payload }: PayloadAction<boolean>) {
      state.open = payload
    },
  },
})

// Actions --------------------------------------------
export const { setUpgradeModalOpen } = UpgradeModalSlice.actions

// Selectors ------------------------------------------
export const selectUpgradeModal = (state: RootState) => state.modals.upgradeReducer

// Reducer --------------------------------------------
export default UpgradeModalSlice.reducer
