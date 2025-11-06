import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'

// Types --------------------------------------------
type NotificationModalState = {
  open: boolean
}

// Initial State ------------------------------------
const initialState: NotificationModalState = {
  open: false,
}

// Slice -------------------------------------------
export const notificationModalSlice = createSlice({
  name: 'notificationModal',
  initialState,
  reducers: {
    setNotificationModalOpen(state, { payload }: PayloadAction<boolean>) {
      state.open = payload
    },
  },
})

// Actions --------------------------------------------
export const { setNotificationModalOpen } = notificationModalSlice.actions

// Selectors ------------------------------------------
export const selectNotificationModal = (state: RootState) => state.modals.notificationReducer

// Reducer --------------------------------------------
export default notificationModalSlice.reducer