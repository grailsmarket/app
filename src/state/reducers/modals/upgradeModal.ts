import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'

// Types --------------------------------------------
type UpgradeModalState = {
  open: boolean
  preselectedTierId: number | null
}

// Initial State ------------------------------------
const initialState: UpgradeModalState = {
  open: false,
  preselectedTierId: null,
}

// Slice -------------------------------------------
export const UpgradeModalSlice = createSlice({
  name: 'UpgradeModal',
  initialState,
  reducers: {
    setUpgradeModalOpen(state, { payload }: PayloadAction<boolean>) {
      state.open = payload
      if (!payload) state.preselectedTierId = null
    },
    openUpgradeModalWithTier(state, { payload }: PayloadAction<number>) {
      state.open = true
      state.preselectedTierId = payload
    },
  },
})

// Actions --------------------------------------------
export const { setUpgradeModalOpen, openUpgradeModalWithTier } = UpgradeModalSlice.actions

// Selectors ------------------------------------------
export const selectUpgradeModal = (state: RootState) => state.modals.upgradeReducer

// Reducer --------------------------------------------
export default UpgradeModalSlice.reducer
