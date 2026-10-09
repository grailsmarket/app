import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'

type MigrationModalState = {
  open: boolean
  names: string[]
}

const initialState: MigrationModalState = {
  open: false,
  names: [],
}

export const MigrationModalSlice = createSlice({
  name: 'MigrationModal',
  initialState,
  reducers: {
    openMigrationModal(state, { payload }: PayloadAction<string[]>) {
      state.open = true
      state.names = payload
    },
    closeMigrationModal(state) {
      state.open = false
      state.names = []
    },
  },
})

export const { openMigrationModal, closeMigrationModal } = MigrationModalSlice.actions
export const selectMigrationModal = (state: RootState) => state.modals.migrationReducer
export default MigrationModalSlice.reducer
