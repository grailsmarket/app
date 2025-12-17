import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'

// Types --------------------------------------------
export type ViewType = 'list' | 'grid'

type ViewTypeState = {
  viewType: 'list' | 'grid'
}

// Initial State ------------------------------------
const initialState: ViewTypeState = {
  viewType: 'grid',
}

// Slice -------------------------------------------
export const viewTypeSlice = createSlice({
  name: 'view type',
  initialState,
  reducers: {
    setViewType(state, { payload }: PayloadAction<'list' | 'grid'>) {
      state.viewType = payload
    },
  },
})

// Actions --------------------------------------------
export const { setViewType } = viewTypeSlice.actions

// Selectors ------------------------------------------
export const selectViewType = (state: RootState) => state.view.viewType

// Reducer --------------------------------------------
export default viewTypeSlice.reducer
