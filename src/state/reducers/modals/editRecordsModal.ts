import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'

// Types --------------------------------------------
type EditRecordsModalState = {
  open: boolean
  name: string | null
  metadata: Record<string, string> | null
  defaultTab: 'records' | 'roles'
}

// Initial State ------------------------------------
const initialState: EditRecordsModalState = {
  open: false,
  name: null,
  metadata: null,
  defaultTab: 'records',
}

// Slice -------------------------------------------
export const EditRecordsModalSlice = createSlice({
  name: 'EditRecordsModal',
  initialState,
  reducers: {
    setEditRecordsModalOpen(state, { payload }: PayloadAction<boolean>) {
      state.open = payload
    },
    setEditRecordsModalName(state, { payload }: PayloadAction<string | null>) {
      state.name = payload
    },
    setEditRecordsModalMetadata(state, { payload }: PayloadAction<Record<string, string> | null>) {
      state.metadata = payload
    },
    setEditRecordsModalDefaultTab(state, { payload }: PayloadAction<'records' | 'roles'>) {
      state.defaultTab = payload
    },
  },
})

// Actions --------------------------------------------
export const {
  setEditRecordsModalOpen,
  setEditRecordsModalName,
  setEditRecordsModalMetadata,
  setEditRecordsModalDefaultTab,
} = EditRecordsModalSlice.actions

// Selectors ------------------------------------------
export const selectEditRecordsModal = (state: RootState) => state.modals.editRecordsReducer

// Reducer --------------------------------------------
export default EditRecordsModalSlice.reducer
