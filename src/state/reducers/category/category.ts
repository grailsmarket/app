import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { CATEGORY_TABS } from '@/constants/domains/category/tabs'
import { RootState } from '../../index'

// Types
export type CategoryTabType = (typeof CATEGORY_TABS)[number]

type CategoryState = {
  selectedTab: CategoryTabType
}

// Initial State
const initialState: CategoryState = {
  selectedTab: CATEGORY_TABS[0],
}

// Slice
export const categorySlice = createSlice({
  name: 'category',
  initialState,
  reducers: {
    changeCategoryTab(state, { payload }: PayloadAction<CategoryTabType>) {
      state.selectedTab = payload
    },
    resetCategoryState(state) {
      state.selectedTab = CATEGORY_TABS[0]
    },
  },
})

// Actions
export const { changeCategoryTab, resetCategoryState } = categorySlice.actions

// Selectors
export const selectCategory = (state: RootState) => state.category.category

// Reducer
export default categorySlice.reducer
