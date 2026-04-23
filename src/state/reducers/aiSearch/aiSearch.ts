import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { AI_SEARCH_TABS, AiSearchTabType } from '@/constants/domains/aiSearch/tabs'
import { RootState } from '../../index'

// Types --------------------------------------------
type AiSearchState = {
  selectedTab: AiSearchTabType
}

// Initial State ------------------------------------
const initialState: AiSearchState = {
  selectedTab: AI_SEARCH_TABS[0],
}

// Slice -------------------------------------------
export const aiSearchSlice = createSlice({
  name: 'aiSearch',
  initialState,
  reducers: {
    changeAiSearchTab(state, { payload }: PayloadAction<AiSearchTabType>) {
      state.selectedTab = payload
    },
    resetAiSearchState(state) {
      state.selectedTab = AI_SEARCH_TABS[0]
    },
  },
})

// Actions --------------------------------------------
export const { changeAiSearchTab, resetAiSearchState } = aiSearchSlice.actions

// Selectors ------------------------------------------
export const selectAiSearch = (state: RootState) => state.aiSearch.aiSearch

// Reducer --------------------------------------------
export default aiSearchSlice.reducer
