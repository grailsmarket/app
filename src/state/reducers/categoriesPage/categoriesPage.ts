import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { CATEGORIES_PAGE_TABS, CategoriesPageTabType } from '@/constants/categories/categoriesPageTabs'
import { RootState } from '../../index'

// Types --------------------------------------------
type CategoriesPageState = {
  selectedTab: CategoriesPageTabType
}

// Initial State ------------------------------------
const initialState: CategoriesPageState = {
  selectedTab: CATEGORIES_PAGE_TABS[0],
}

// Slice -------------------------------------------
export const categoriesPageSlice = createSlice({
  name: 'categoriesPage',
  initialState,
  reducers: {
    changeCategoriesPageTab(state, { payload }: PayloadAction<CategoriesPageTabType>) {
      state.selectedTab = payload
    },
    resetCategoriesPageState(state) {
      state.selectedTab = CATEGORIES_PAGE_TABS[0]
    },
  },
})

// Actions --------------------------------------------
export const { changeCategoriesPageTab, resetCategoriesPageState } = categoriesPageSlice.actions

// Selectors ------------------------------------------
export const selectCategoriesPage = (state: RootState) => state.categoriesPage

// Reducer --------------------------------------------
export default categoriesPageSlice.reducer
