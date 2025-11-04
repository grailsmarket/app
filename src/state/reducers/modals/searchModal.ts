import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'

// Types --------------------------------------------
type GlobalSearchModalState = {
  open: boolean
  query: string
}

// Initial State ------------------------------------
const initialState: GlobalSearchModalState = {
  open: false,
  query: '',
}

// Slice -------------------------------------------
export const SearchModalSlice = createSlice({
  name: 'SearchModal',
  initialState,
  reducers: {
    setSearchModalOpen(state, { payload }: PayloadAction<boolean>) {
      state.open = payload
    },
    setSearchModalQuery(state, { payload }: PayloadAction<string>) {
      state.query = payload
    },
  },
})

// Actions --------------------------------------------
export const { setSearchModalOpen, setSearchModalQuery } = SearchModalSlice.actions

// Selectors ------------------------------------------
export const selectSearchModal = (state: RootState) => state.modals.searchReducer

// Reducer --------------------------------------------
export default SearchModalSlice.reducer
