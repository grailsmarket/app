import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../../index'

const initialState = { open: false, names: [] as string[] }

const bulkMigrationModal = createSlice({
  name: 'BulkMigrationModal',
  initialState,
  reducers: {
    setBulkMigrationModalOpen(state, { payload }: PayloadAction<boolean>) {
      state.open = payload
    },
    setBulkMigrationModalNames(state, { payload }: PayloadAction<string[]>) {
      state.names = payload
    },
  },
})

export const { setBulkMigrationModalOpen, setBulkMigrationModalNames } = bulkMigrationModal.actions
export const selectBulkMigrationModal = (state: RootState) => state.modals.bulkMigrationReducer
export default bulkMigrationModal.reducer
