import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'

// Types --------------------------------------------
type MarketplaceDomainsState = {
  listScrollTop: number
  gridScrollTop: number
}

// Initial State ------------------------------------
const initialState: MarketplaceDomainsState = {
  listScrollTop: 0,
  gridScrollTop: 0,
}

// Slice -------------------------------------------
export const scrollPositionSlice = createSlice({
  name: 'scrollPosition',
  initialState,
  reducers: {
    setListScrollTop(state, { payload }: PayloadAction<number>) {
      state.listScrollTop = payload
    },
    setGridScrollTop(state, { payload }: PayloadAction<number>) {
      state.gridScrollTop = payload
    },
  },
})

// Actions --------------------------------------------
export const { setListScrollTop, setGridScrollTop } = scrollPositionSlice.actions

// Selectors ------------------------------------------
export const selectScrollPosition = (state: RootState) => state.scroll.position

// Reducer --------------------------------------------
export default scrollPositionSlice.reducer
