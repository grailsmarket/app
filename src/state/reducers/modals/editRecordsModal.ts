import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'

// Types --------------------------------------------
type EditRecordsModalState = {
  open: boolean
  name: string | null
  version: number | null
  metadata: Record<string, string> | null
  defaultTab: 'records' | 'roles'
  startWithMigration: boolean
}

// Initial State ------------------------------------
const initialState: EditRecordsModalState = {
  open: false,
  name: null,
  version: null,
  metadata: null,
  defaultTab: 'records',
  startWithMigration: false,
}

// Slice -------------------------------------------
export const EditRecordsModalSlice = createSlice({
  name: 'EditRecordsModal',
  initialState,
  reducers: {
    setEditRecordsModalOpen(state, { payload }: PayloadAction<boolean>) {
      state.open = payload
      if (!payload) state.startWithMigration = false
    },
    setEditRecordsModalName(state, { payload }: PayloadAction<string | null>) {
      state.name = payload
      state.version = null
      state.defaultTab = 'records'
      state.startWithMigration = false
    },
    setEditRecordsModalVersion(state, { payload }: PayloadAction<number | null>) {
      state.version = payload
    },
    setEditRecordsModalMetadata(state, { payload }: PayloadAction<Record<string, string> | null>) {
      state.metadata = payload
    },
    setEditRecordsModalDefaultTab(state, { payload }: PayloadAction<'records' | 'roles'>) {
      state.defaultTab = payload
    },
    setEditRecordsModalStartWithMigration: (state, { payload }: PayloadAction<boolean>) => {
      state.startWithMigration = payload
    },
  },
})

// Actions --------------------------------------------
export const {
  setEditRecordsModalOpen,
  setEditRecordsModalName,
  setEditRecordsModalVersion,
  setEditRecordsModalMetadata,
  setEditRecordsModalDefaultTab,
  setEditRecordsModalStartWithMigration,
} = EditRecordsModalSlice.actions

// Selectors ------------------------------------------
export const selectEditRecordsModal = (state: RootState) => state.modals.editRecordsReducer

// Reducer --------------------------------------------
export default EditRecordsModalSlice.reducer
