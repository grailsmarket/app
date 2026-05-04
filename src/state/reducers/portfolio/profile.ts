import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { PROFILE_TABS } from '@/constants/domains/portfolio/tabs'
import { RootState } from '../../index'
import { MarketplaceDomainType, WatchlistListType } from '@/types/domains'
import { Address } from 'ethereum-identity-kit'

// Types --------------------------------------------
export type ProfileTabType = (typeof PROFILE_TABS)[number]

type EnsProfileType = {
  name: string | null
  avatar: string | null
  header: string | null
}

type SubscriptionType = {
  tier: 'free' | 'pro' | 'plus' | 'gold'
  tierId: number
  tierExpiresAt: string | null
}

type profileState = {
  ensProfile: EnsProfileType
  userId: number | null
  watchlist: MarketplaceDomainType[]
  watchlistLists: WatchlistListType[]
  selectedWatchlistListId: number | null
  pendingWatchlistTokenIds: string[]
  selectedTab: ProfileTabType
  email: {
    address: string | null
    verified: boolean
  }
  discord: string | null
  telegram: string | null
  telegramConnected: boolean
  telegramVerificationCode: string | null
  poapClaimed: boolean
  subscription: SubscriptionType
  lastVisitedProfile: Address | string | null
  offerNotificationThreshold: number | null
  notifyOnListingSold: boolean
  notifyOnOfferReceived: boolean
  notifyOnCommentReceived: boolean
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
  telegramConnected: false,
  telegramVerificationCode: null,
  poapClaimed: false,
  subscription: { tier: 'free', tierId: 0, tierExpiresAt: null },
  watchlist: [],
  watchlistLists: [],
  selectedWatchlistListId: null,
  offerNotificationThreshold: null,
  pendingWatchlistTokenIds: [],
  selectedTab: PROFILE_TABS[0],
  lastVisitedProfile: null,
  notifyOnListingSold: true,
  notifyOnOfferReceived: true,
  notifyOnCommentReceived: true,
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
    setTelegramConnected(state, { payload }: PayloadAction<boolean>) {
      state.telegramConnected = payload
    },
    setTelegramVerificationCode(state, { payload }: PayloadAction<string | null>) {
      state.telegramVerificationCode = payload
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
    setWatchlistLists(state, { payload }: PayloadAction<WatchlistListType[]>) {
      state.watchlistLists = payload
      if (state.selectedWatchlistListId == null) {
        const defaultList = payload.find((list) => list.isDefault)
        if (defaultList) state.selectedWatchlistListId = defaultList.id
      }
    },
    addWatchlistList(state, { payload }: PayloadAction<WatchlistListType>) {
      if (!state.watchlistLists) state.watchlistLists = []
      if (!state.watchlistLists.some((list) => list.id === payload.id)) {
        state.watchlistLists.push(payload)
      }
    },
    updateWatchlistList(state, { payload }: PayloadAction<WatchlistListType>) {
      if (!state.watchlistLists) state.watchlistLists = []
      state.watchlistLists = state.watchlistLists.map((list) => (list.id === payload.id ? payload : list))
    },
    removeWatchlistList(state, { payload }: PayloadAction<number>) {
      if (!state.watchlistLists) state.watchlistLists = []
      state.watchlistLists = state.watchlistLists.filter((list) => list.id !== payload)
      if (state.selectedWatchlistListId === payload) {
        const defaultList = state.watchlistLists.find((list) => list.isDefault)
        state.selectedWatchlistListId = defaultList?.id ?? null
      }
    },
    incrementWatchlistListItemCount(state, { payload }: PayloadAction<number>) {
      if (!state.watchlistLists) return
      const list = state.watchlistLists.find((l) => l.id === payload)
      if (list) list.itemCount += 1
    },
    decrementWatchlistListItemCount(state, { payload }: PayloadAction<number>) {
      if (!state.watchlistLists) return
      const list = state.watchlistLists.find((l) => l.id === payload)
      if (list && list.itemCount > 0) list.itemCount -= 1
    },
    setSelectedWatchlistListId(state, { payload }: PayloadAction<number | null>) {
      state.selectedWatchlistListId = payload
    },
    addUserPendingWatchlistDomain(state, { payload }: PayloadAction<string>) {
      if (state.pendingWatchlistTokenIds === undefined) state.pendingWatchlistTokenIds = []
      state.pendingWatchlistTokenIds?.push(payload)
    },
    removeUserPendingWatchlistDomain(state, { payload }: PayloadAction<string>) {
      if (state.pendingWatchlistTokenIds === undefined) state.pendingWatchlistTokenIds = []
      state.pendingWatchlistTokenIds = state.pendingWatchlistTokenIds?.filter((item) => item !== payload)
    },
    setOfferNotificationThreshold(state, { payload }: PayloadAction<number | null>) {
      state.offerNotificationThreshold = payload
    },
    setNotifyOnListingSold(state, { payload }: PayloadAction<boolean>) {
      state.notifyOnListingSold = payload
    },
    setNotifyOnOfferReceived(state, { payload }: PayloadAction<boolean>) {
      state.notifyOnOfferReceived = payload
    },
    setNotifyOnCommentReceived(state, { payload }: PayloadAction<boolean>) {
      state.notifyOnCommentReceived = payload
    },
    changeTab(state, { payload }: PayloadAction<ProfileTabType>) {
      state.selectedTab = payload
    },
    setLastVisitedProfile(state, { payload }: PayloadAction<Address | string | null>) {
      state.lastVisitedProfile = payload
    },
    setUserSubscription(state, { payload }: PayloadAction<SubscriptionType>) {
      state.subscription = payload
    },
    resetUserProfile(state) {
      state.ensProfile = nullEnsProfile
      state.userId = null
      state.email = { address: null, verified: false }
      state.discord = null
      state.telegram = null
      state.telegramConnected = false
      state.telegramVerificationCode = null
      state.poapClaimed = false
      state.subscription = { tier: 'free', tierId: 0, tierExpiresAt: null }
      state.watchlist = []
      state.watchlistLists = []
      state.selectedWatchlistListId = null
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
  setTelegramConnected,
  setTelegramVerificationCode,
  setUserPoapClaimed,
  setWatchlistDomains,
  addUserWatchlistDomain,
  addUserWatchlistDomains,
  removeUserWatchlistDomain,
  setWatchlistLists,
  addWatchlistList,
  updateWatchlistList,
  removeWatchlistList,
  incrementWatchlistListItemCount,
  decrementWatchlistListItemCount,
  setSelectedWatchlistListId,
  addUserPendingWatchlistDomain,
  removeUserPendingWatchlistDomain,
  changeTab,
  setLastVisitedProfile,
  setUserSubscription,
  resetUserProfile,
  setOfferNotificationThreshold,
  setNotifyOnListingSold,
  setNotifyOnOfferReceived,
  setNotifyOnCommentReceived,
} = profileSlice.actions

// Selectors ------------------------------------------
export const selectUserProfile = (state: RootState) => state.profile.profile

// Reducer --------------------------------------------
export default profileSlice.reducer
