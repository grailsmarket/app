import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { CATEGORY_TABS } from '@/constants/domains/category/tabs'
import { RootState } from '../../index'

// Types
export type CategoryTabType = (typeof CATEGORY_TABS)[number]

type CategoryState = {
  selectedTab: CategoryTabType
  lastVisitedCategory: string | null
}

// Initial State
const initialState: CategoryState = {
  selectedTab: CATEGORY_TABS[0],
  lastVisitedCategory: null,
}

// Slice
export const categorySlice = createSlice({
  name: 'category',
  initialState,
  reducers: {
    changeCategoryTab(state, { payload }: PayloadAction<CategoryTabType>) {
      state.selectedTab = payload
    },
    setLastVisitedCategory(state, { payload }: PayloadAction<string | null>) {
      state.lastVisitedCategory = payload
    },
    resetCategoryState(state) {
      state.selectedTab = CATEGORY_TABS[0]
    },
  },
})

// Actions
export const { changeCategoryTab, resetCategoryState, setLastVisitedCategory } = categorySlice.actions

// Selectors
export const selectCategory = (state: RootState) => state.category.category

// Reducer
export default categorySlice.reducer
