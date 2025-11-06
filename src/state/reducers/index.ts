import { combineReducers } from 'redux'
import { persistReducer } from 'redux-persist'

import storage from '../storage'
import cacheReducer from './cache'
import modalReducer from './modals'
import searchReducer from './search'
import scrollPosition from './scroll'
import domainsReducer from './domains'
import filtersReducer from './filters'
import profileReducer from './portfolio'
import transactionReducer from './transactions'

const PERSISTED_KEYS: string[] = ['filters', 'cache', 'user']

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
  modals: modalReducer,
  user: profileReducer,
  transactions: transactionReducer,
  cache: cacheReducer,
  scroll: scrollPosition,
})

const persistedReducer = persistReducer(persistConfig, reducer)

export default persistedReducer
