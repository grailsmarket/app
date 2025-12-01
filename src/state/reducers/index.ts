import { combineReducers } from 'redux'
import { persistReducer } from 'redux-persist'

import storage from '../storage'
import cacheReducer from './cache'
import modalReducer from './modals'
import scrollPosition from './scroll'
import domainsReducer from './domains'
import filtersReducer from './filters'
import profileReducer from './portfolio'
import transactionReducer from './transactions'
import registrationReducer from './registration'

const PERSISTED_KEYS: string[] = ['cache', 'registration']

const persistConfig = {
  key: 'root',
  whitelist: PERSISTED_KEYS,
  version: 1,
  storage,
}

const reducer = combineReducers({
  filters: filtersReducer,
  domains: domainsReducer,
  modals: modalReducer,
  profile: profileReducer,
  transactions: transactionReducer,
  cache: cacheReducer,
  scroll: scrollPosition,
  registration: registrationReducer,
})

const persistedReducer = persistReducer(persistConfig, reducer)

export default persistedReducer
