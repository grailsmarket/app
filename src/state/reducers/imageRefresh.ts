import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '@/state'

interface ImageRefreshState {
  pending: Record<string, number>
}

const initialState: ImageRefreshState = {
  pending: {},
}

const imageRefreshSlice = createSlice({
  name: 'imageRefresh',
  initialState,
  reducers: {
    markImageForRefresh: (state, action: PayloadAction<string>) => {
      state.pending[action.payload] = Date.now()
    },
    consumeImageRefresh: (state, action: PayloadAction<string>) => {
      delete state.pending[action.payload]
    },
  },
})

export const { markImageForRefresh, consumeImageRefresh } = imageRefreshSlice.actions

export const selectImageRefreshKey = (name: string) => (state: RootState) => state.imageRefresh.pending[name]

export default imageRefreshSlice.reducer
