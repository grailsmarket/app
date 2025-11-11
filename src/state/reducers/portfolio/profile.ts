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
  userId: number | null
  watchlist: WatchlistItemType[]
  pendingWatchlistTokenIds: string[]
  selectedTab: TabType
  email: {
    address: string | null
    verified: boolean
  }
  discord: string | null
  telegram: string | null
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
  userId: null,
  email: {
    address: null,
    verified: false,
  },
  discord: null,
  telegram: null,
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
    setUserId(state, { payload }: PayloadAction<number | null>) {
      state.userId = payload
    },
    setUserEmail(state, { payload }: PayloadAction<{ address: string | null; verified: boolean }>) {
      state.email = payload
    },
    setUserDiscord(state, { payload }: PayloadAction<string | null>) {
      state.discord = payload
    },
    setUserTelegram(state, { payload }: PayloadAction<string | null>) {
      state.telegram = payload
    },
    setWatchlistDomains(state, { payload }: PayloadAction<WatchlistItemType[]>) {
      state.watchlist = payload
    },
    addUserWatchlistDomain(state, { payload }: PayloadAction<WatchlistItemType>) {
      state.watchlist.push(payload)
    },
    addUserWatchlistDomains(state, { payload }: PayloadAction<WatchlistItemType[]>) {
      const namesNotInWatchlist = payload.filter(
        (item) => !state.watchlist.some((watchlistItem) => watchlistItem.id === item.id)
      )
      state.watchlist = state.watchlist.concat(namesNotInWatchlist)
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
    resetUserProfile(state) {
      state.ensProfile = nullEnsProfile
      state.userId = null
      state.email = { address: null, verified: false }
      state.discord = null
      state.telegram = null
      state.watchlist = []
      state.pendingWatchlistTokenIds = []
    },
  },
})

// Actions --------------------------------------------
export const {
  setUserEnsProfile,
  setUserId,
  setUserEmail,
  setUserDiscord,
  setUserTelegram,
  setWatchlistDomains,
  addUserWatchlistDomain,
  addUserWatchlistDomains,
  removeUserWatchlistDomain,
  addUserPendingWatchlistDomain,
  removeUserPendingWatchlistDomain,
  changeTab,
  resetUserProfile,
} = profileSlice.actions

// Selectors ------------------------------------------
export const selectUserProfile = (state: RootState) => state.profile.profile

// Reducer --------------------------------------------
export default profileSlice.reducer
