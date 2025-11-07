import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { portfolioTabs } from '@/constants/domains/portfolio/tabs'
import { RootState } from '../../index'
import { WatchlistItemType } from '@/types/domains'

// Types --------------------------------------------
type TabType = (typeof portfolioTabs)[number]

type EnsProfileType = {
  name: string | null
  avatar: string | null
  header: string | null
}

type profileState = {
  ensProfile: EnsProfileType
  watchlist: WatchlistItemType[]
  pendingWatchlistTokenIds: string[]
  selectedTab: TabType
}

export const nullEnsProfile = {
  name: null,
  avatar: null,
  header: null,
}

// Initial State ------------------------------------
const initialState: profileState = {
  ensProfile: {
    name: null,
    avatar: null,
    header: null,
  },
  watchlist: [],
  pendingWatchlistTokenIds: [],
  selectedTab: portfolioTabs[0],
}

// Slice -------------------------------------------
export const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    setUserEnsProfile(state, { payload }: PayloadAction<EnsProfileType>) {
      state.ensProfile = payload
    },
    setWatchlistDomains(state, { payload }: PayloadAction<WatchlistItemType[]>) {
      state.watchlist = payload
    },
    addUserWatchlistDomain(state, { payload }: PayloadAction<WatchlistItemType>) {
      state.watchlist.push(payload)
    },
    removeUserWatchlistDomain(state, { payload }: PayloadAction<number>) {
      state.watchlist = state.watchlist.filter((item) => item.id !== payload)
    },
    addUserPendingWatchlistDomain(state, { payload }: PayloadAction<string>) {
      if (state.pendingWatchlistTokenIds === undefined) state.pendingWatchlistTokenIds = []
      state.pendingWatchlistTokenIds?.push(payload)
    },
    removeUserPendingWatchlistDomain(state, { payload }: PayloadAction<string>) {
      if (state.pendingWatchlistTokenIds === undefined) state.pendingWatchlistTokenIds = []
      state.pendingWatchlistTokenIds = state.pendingWatchlistTokenIds?.filter((item) => item !== payload)
    },
    changeTab(state, { payload }: PayloadAction<TabType>) {
      state.selectedTab = payload
    },
  },
})

// Actions --------------------------------------------
export const {
  setUserEnsProfile,
  setWatchlistDomains,
  addUserWatchlistDomain,
  removeUserWatchlistDomain,
  addUserPendingWatchlistDomain,
  removeUserPendingWatchlistDomain,
  changeTab,
} = profileSlice.actions

// Selectors ------------------------------------------
export const selectUserProfile = (state: RootState) => state.user.profile

// Reducer --------------------------------------------
export default profileSlice.reducer
