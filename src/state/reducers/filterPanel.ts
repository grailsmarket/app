import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '@/state'

interface FilterPanelState {
  open: boolean
}

const initialState: FilterPanelState = {
  open: false,
}

const filterPanelSlice = createSlice({
  name: 'filterPanel',
  initialState,
  reducers: {
    setFilterPanelOpen: (state, action: PayloadAction<boolean>) => {
      state.open = action.payload
    },
    toggleFilterPanel: (state) => {
      state.open = !state.open
    },
  },
})

export const { setFilterPanelOpen, toggleFilterPanel } = filterPanelSlice.actions

export const selectFilterPanel = (state: RootState) => state.filterPanel

export default filterPanelSlice.reducer
