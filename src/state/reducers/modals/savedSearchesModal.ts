import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'

// Types --------------------------------------------
type SavedSearchesModalState = {
  open: boolean
  savedSearchActive: boolean
}

// Initial State ------------------------------------
const initialState: SavedSearchesModalState = {
  open: false,
  savedSearchActive: false,
}

// Slice -------------------------------------------
export const savedSearchesModalSlice = createSlice({
  name: 'savedSearchesModal',
  initialState,
  reducers: {
    setSavedSearchesModalOpen(state, { payload }: PayloadAction<boolean>) {
      state.open = payload
    },
    setSavedSearchActive(state, { payload }: PayloadAction<boolean>) {
      state.savedSearchActive = payload
    },
  },
})

// Actions --------------------------------------------
export const { setSavedSearchesModalOpen, setSavedSearchActive } = savedSearchesModalSlice.actions

// Selectors ------------------------------------------
export const selectSavedSearchesModal = (state: RootState) => state.modals.savedSearchesReducer

// Reducer --------------------------------------------
export default savedSearchesModalSlice.reducer
