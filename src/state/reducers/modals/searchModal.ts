import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'

// Types --------------------------------------------
type CancelOfferModalState = {
  open: boolean
  search: string | null
}

// Initial State ------------------------------------
const initialState: CancelOfferModalState = {
  open: false,
  search: null,
}

// Slice -------------------------------------------
export const SearchModalSlice = createSlice({
  name: 'SearchModal',
  initialState,
  reducers: {
    setSearchModalOpen(state, { payload }: PayloadAction<boolean>) {
      state.open = payload
    },
    setSearchModalSearch(state, { payload }: PayloadAction<string | null>) {
      state.search = payload
    },
  },
})

// Actions --------------------------------------------
export const { setSearchModalOpen, setSearchModalSearch } = SearchModalSlice.actions

// Selectors ------------------------------------------
export const selectSearchModal = (state: RootState) => state.modals.searchReducer

// Reducer --------------------------------------------
export default SearchModalSlice.reducer
