import { combineReducers } from 'redux'
import { persistReducer } from 'redux-persist'

import storage from '../storage'
import tabsReducer from './tabs'
import cacheReducer from './cache'
import modalReducer from './modals'
import searchReducer from './search'
import scrollPosition from './scroll'
import domainsReducer from './domains'
import filtersReducer from './filters'
import profileReducer from './profile'
import transactionReducer from './transactions'
import notificationsReducer from './notifications'

const PERSISTED_KEYS: string[] = ['filters', 'cache']

const persistConfig = {
  key: 'root',
  whitelist: PERSISTED_KEYS,
  version: 1,
  storage,
}

const reducer = combineReducers({
  filters: filtersReducer,
  domains: domainsReducer,
  search: searchReducer,
  notifications: notificationsReducer,
  modals: modalReducer,
  user: profileReducer,
  tabs: tabsReducer,
  transactions: transactionReducer,
  cache: cacheReducer,
  scroll: scrollPosition,
})

const persistedReducer = persistReducer(persistConfig, reducer)

export default persistedReducer
