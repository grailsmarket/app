import { combineReducers } from 'redux'
import { persistReducer } from 'redux-persist'

import storage from '../storage'
import modalReducer from './modals'
import scrollPosition from './scroll'
import domainsReducer from './domains'
import filtersReducer from './filters'
import filterPanelReducer from './filterPanel'
import profileReducer from './portfolio'
import marketplaceReducer from './marketplace'
import categoryReducer from './category'
import categoriesPageReducer from './categoriesPage'
import transactionReducer from './transactions'
import registrationReducer from './registration'
import viewReducer from './view'

const PERSISTED_KEYS: string[] = ['registration', 'view']

const persistConfig = {
  key: 'root',
  whitelist: PERSISTED_KEYS,
  version: 1,
  storage,
}

const reducer = combineReducers({
  filters: filtersReducer,
  filterPanel: filterPanelReducer,
  domains: domainsReducer,
  modals: modalReducer,
  profile: profileReducer,
  marketplace: marketplaceReducer,
  category: categoryReducer,
  categoriesPage: categoriesPageReducer,
  transactions: transactionReducer,
  scroll: scrollPosition,
  registration: registrationReducer,
  view: viewReducer,
})

const persistedReducer = persistReducer(persistConfig, reducer)

export default persistedReducer
