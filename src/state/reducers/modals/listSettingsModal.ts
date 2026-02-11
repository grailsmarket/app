import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'
import { ProfileDetailsResponse } from 'ethereum-identity-kit'

// Types --------------------------------------------
type ListSettingsModalState = {
  open: boolean
  user: ProfileDetailsResponse | null
  list: number | null
}

// Initial State ------------------------------------
const initialState: ListSettingsModalState = {
  open: false,
  user: null,
  list: null,
}

// Slice -------------------------------------------
export const ListSettingsModalSlice = createSlice({
  name: 'ListSettingsModal',
  initialState,
  reducers: {
    setListSettingsModalOpen(state, { payload }: PayloadAction<boolean>) {
      state.open = payload
    },
    setListSettingsModalUser(state, { payload }: PayloadAction<ProfileDetailsResponse | null>) {
      state.user = payload
    },
    setListSettingsModalList(state, { payload }: PayloadAction<number | null>) {
      state.list = payload
    },
  },
})

// Actions --------------------------------------------
export const { setListSettingsModalOpen, setListSettingsModalUser, setListSettingsModalList } =
  ListSettingsModalSlice.actions

// Selectors ------------------------------------------
export const selectListSettingsModal = (state: RootState) => state.modals.listSettingsReducer

// Reducer --------------------------------------------
export default ListSettingsModalSlice.reducer
