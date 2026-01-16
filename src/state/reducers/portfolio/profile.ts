import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { PROFILE_TABS } from '@/constants/domains/portfolio/tabs'
import { RootState } from '../../index'
import { MarketplaceDomainType } from '@/types/domains'
import { Address } from 'ethereum-identity-kit'

// Types --------------------------------------------
export type ProfileTabType = (typeof PROFILE_TABS)[number]

type EnsProfileType = {
  name: string | null
  avatar: string | null
  header: string | null
}

type profileState = {
  ensProfile: EnsProfileType
  userId: number | null
  watchlist: MarketplaceDomainType[]
  pendingWatchlistTokenIds: string[]
  selectedTab: ProfileTabType
  email: {
    address: string | null
    verified: boolean
  }
  discord: string | null
  telegram: string | null
  poapClaimed: boolean
  lastVisitedProfile: Address | string | null
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
  poapClaimed: false,
  watchlist: [],
  pendingWatchlistTokenIds: [],
  selectedTab: PROFILE_TABS[0],
  lastVisitedProfile: null,
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
    setUserPoapClaimed(state, { payload }: PayloadAction<boolean>) {
      state.poapClaimed = payload
    },
    setWatchlistDomains(state, { payload }: PayloadAction<MarketplaceDomainType[]>) {
      state.watchlist = payload
    },
    addUserWatchlistDomain(state, { payload }: PayloadAction<MarketplaceDomainType>) {
      state.watchlist.push(payload)
    },
    addUserWatchlistDomains(state, { payload }: PayloadAction<MarketplaceDomainType[]>) {
      const namesNotInWatchlist = payload.filter(
        (item) =>
          !state.watchlist.some((watchlistItem) => watchlistItem.watchlist_record_id === item.watchlist_record_id)
      )
      state.watchlist = state.watchlist.concat(namesNotInWatchlist)
    },
    removeUserWatchlistDomain(state, { payload }: PayloadAction<number>) {
      state.watchlist = state.watchlist.filter((item) => item.watchlist_record_id !== payload)
    },
    addUserPendingWatchlistDomain(state, { payload }: PayloadAction<string>) {
      if (state.pendingWatchlistTokenIds === undefined) state.pendingWatchlistTokenIds = []
      state.pendingWatchlistTokenIds?.push(payload)
    },
    removeUserPendingWatchlistDomain(state, { payload }: PayloadAction<string>) {
      if (state.pendingWatchlistTokenIds === undefined) state.pendingWatchlistTokenIds = []
      state.pendingWatchlistTokenIds = state.pendingWatchlistTokenIds?.filter((item) => item !== payload)
    },
    changeTab(state, { payload }: PayloadAction<ProfileTabType>) {
      state.selectedTab = payload
    },
    setLastVisitedProfile(state, { payload }: PayloadAction<Address | string | null>) {
      state.lastVisitedProfile = payload
    },
    resetUserProfile(state) {
      state.ensProfile = nullEnsProfile
      state.userId = null
      state.email = { address: null, verified: false }
      state.discord = null
      state.telegram = null
      state.poapClaimed = false
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
  setUserPoapClaimed,
  setWatchlistDomains,
  addUserWatchlistDomain,
  addUserWatchlistDomains,
  removeUserWatchlistDomain,
  addUserPendingWatchlistDomain,
  removeUserPendingWatchlistDomain,
  changeTab,
  setLastVisitedProfile,
  resetUserProfile,
} = profileSlice.actions

// Selectors ------------------------------------------
export const selectUserProfile = (state: RootState) => state.profile.profile

// Reducer --------------------------------------------
export default profileSlice.reducer
