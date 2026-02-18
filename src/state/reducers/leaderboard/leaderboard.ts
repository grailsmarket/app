import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'
import { LeaderboardSortBy, LeaderboardSortOrder } from '@/types/leaderboard'

// Types --------------------------------------------
type LeaderboardState = {
  sortBy: LeaderboardSortBy
  sortOrder: LeaderboardSortOrder
  selectedClubs: string[]
}

// Initial State ------------------------------------
const initialState: LeaderboardState = {
  sortBy: 'names_owned',
  sortOrder: 'desc',
  selectedClubs: [],
}

// Slice -------------------------------------------
export const leaderboardSlice = createSlice({
  name: 'leaderboard',
  initialState,
  reducers: {
    changeLeaderboardSortBy(state, { payload }: PayloadAction<LeaderboardSortBy>) {
      state.sortBy = payload
    },
    changeLeaderboardSortOrder(state, { payload }: PayloadAction<LeaderboardSortOrder>) {
      state.sortOrder = payload
    },
    changeLeaderboardSelectedClubs(state, { payload }: PayloadAction<string[]>) {
      state.selectedClubs = payload
    },
  },
})

// Actions --------------------------------------------
export const { changeLeaderboardSortBy, changeLeaderboardSortOrder, changeLeaderboardSelectedClubs } =
  leaderboardSlice.actions

// Selectors ------------------------------------------
export const selectLeaderboardState = (state: RootState) => state.leaderboard

// Reducer --------------------------------------------
export default leaderboardSlice.reducer
