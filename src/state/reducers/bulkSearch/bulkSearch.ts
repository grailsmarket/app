import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { BULK_SEARCH_TABS, BulkSearchTabType } from '@/constants/domains/bulkSearch/tabs'
import { RootState } from '../../index'

// Types --------------------------------------------
type BulkSearchState = {
  selectedTab: BulkSearchTabType
  searchTerms: string
}

// Initial State ------------------------------------
const initialState: BulkSearchState = {
  selectedTab: BULK_SEARCH_TABS[0],
  searchTerms: '',
}

// Slice -------------------------------------------
export const bulkSearchSlice = createSlice({
  name: 'bulkSearch',
  initialState,
  reducers: {
    changeBulkSearchTab(state, { payload }: PayloadAction<BulkSearchTabType>) {
      state.selectedTab = payload
    },
    setBulkSearchTerms(state, { payload }: PayloadAction<string>) {
      state.searchTerms = payload
    },
    resetBulkSearchState(state) {
      state.selectedTab = BULK_SEARCH_TABS[0]
      state.searchTerms = ''
    },
  },
})

// Actions --------------------------------------------
export const { changeBulkSearchTab, setBulkSearchTerms, resetBulkSearchState } = bulkSearchSlice.actions

// Selectors ------------------------------------------
export const selectBulkSearch = (state: RootState) => state.bulkSearch.bulkSearch

// Reducer --------------------------------------------
export default bulkSearchSlice.reducer
