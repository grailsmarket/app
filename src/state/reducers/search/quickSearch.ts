import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'

// Types --------------------------------------------
type QuickSearchState = {
  searchTerm: string
  resultsOpen: boolean
}

// Initial State ------------------------------------
const initialState: QuickSearchState = {
  searchTerm: '',
  resultsOpen: false,
}

// Slice -------------------------------------------
export const QuickSearchSlice = createSlice({
  name: 'QuickSearch',
  initialState,
  reducers: {
    setQuickSearchTerm(state, { payload }: PayloadAction<string>) {
      state.searchTerm = payload
    },
    clearQuickSearchTerm(state) {
      state.searchTerm = ''
    },
    setQuickSearchResultsOpen(state, { payload }: PayloadAction<boolean>) {
      state.resultsOpen = payload
    },
  },
})

// Actions --------------------------------------------
export const { setQuickSearchTerm, clearQuickSearchTerm, setQuickSearchResultsOpen } = QuickSearchSlice.actions

// Selectors ------------------------------------------
export const selectQuickSearch = (state: RootState) => state.search.quickSearch

// Reducer --------------------------------------------
export default QuickSearchSlice.reducer
