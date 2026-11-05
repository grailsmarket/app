import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'
import type { BulkRecordName } from '@/types/records'

// Types --------------------------------------------
type BulkEditRecordsModalState = {
  open: boolean
  names: BulkRecordName[]
}

// Initial State ------------------------------------
const initialState: BulkEditRecordsModalState = {
  open: false,
  names: [],
}

// Slice -------------------------------------------
export const BulkEditRecordsModalSlice = createSlice({
  name: 'BulkEditRecordsModal',
  initialState,
  reducers: {
    setBulkEditRecordsModalOpen(state, { payload }: PayloadAction<boolean>) {
      state.open = payload
    },
    setBulkEditRecordsModalNames(state, { payload }: PayloadAction<BulkRecordName[]>) {
      state.names = payload
    },
  },
})

// Actions --------------------------------------------
export const { setBulkEditRecordsModalOpen, setBulkEditRecordsModalNames } = BulkEditRecordsModalSlice.actions

// Selectors ------------------------------------------
export const selectBulkEditRecordsModal = (state: RootState) => state.modals.bulkEditRecordsReducer

// Reducer --------------------------------------------
export default BulkEditRecordsModalSlice.reducer
