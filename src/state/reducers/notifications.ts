import { createSlice } from '@reduxjs/toolkit'
import { RootState } from '../index'
import { MOCK_FOLLOWING, MOCK_NOTIFICATIONS } from '@/constants/mock/notifications'

// Types --------------------------------------------
type MarketplaceSearchState = {
  tab: NotificationTabType
  notifications: NotificationType[]
  following: NotificationType[]
}

type NotificationTabType = 'Inbox' | 'Following'

export type NotificationCategoryType = 'domainExpired' | 'domainListed' | 'sold' | 'offerAccepted'

type NotificationsUnitType = 'ETH' | 'USD'

export type NotificationType = {
  category: NotificationCategoryType
  domain: string
  timestamp: number
  value: string
  units?: NotificationsUnitType
  user?: string
}

// Initial State ------------------------------------
const initialState: MarketplaceSearchState = {
  tab: 'Inbox',
  notifications: MOCK_NOTIFICATIONS,
  following: MOCK_FOLLOWING,
}

// Slice -------------------------------------------
export const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setNotificationsInbox(state) {
      state.tab = 'Inbox'
    },
    setNotificationsFollowing(state) {
      state.tab = 'Following'
    },
  },
})

// Actions --------------------------------------------
export const { setNotificationsInbox, setNotificationsFollowing } = notificationsSlice.actions

// Selectors ------------------------------------------
export const selectNotifications = (state: RootState) => state.notifications

// Reducer --------------------------------------------
export default notificationsSlice.reducer
