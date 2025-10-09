import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'
import { MarketplaceDomainType } from '@/types/domains'
import { portfolioTabs } from '@/constants/domains/portfolio/tabs'

// Types --------------------------------------------
type TabType = (typeof portfolioTabs)[number]

type EnsProfileType = {
  name: string | null
  avatar: string | null
  header: string | null
}

type profileState = {
  ensProfile: EnsProfileType
  watchlist: MarketplaceDomainType[]
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
    setUserLikedDomains(state, { payload }: PayloadAction<MarketplaceDomainType[]>) {
      state.watchlist = payload
    },
    addUserWatchlistDomain(state, { payload }: PayloadAction<MarketplaceDomainType>) {
      state.watchlist.push(payload)
    },
    removeUserWatchlistDomain(state, { payload }: PayloadAction<string>) {
      state.watchlist = state.watchlist.filter((domain) => domain.name !== payload)
    },
    changeTab(state, { payload }: PayloadAction<TabType>) {
      state.selectedTab = payload
    },
  },
})

// Actions --------------------------------------------
export const { setUserEnsProfile, setUserLikedDomains, addUserWatchlistDomain, removeUserWatchlistDomain, changeTab } =
  profileSlice.actions

// Selectors ------------------------------------------
export const selectUserProfile = (state: RootState) => state.user.profile

// Reducer --------------------------------------------
export default profileSlice.reducer
