import { combineReducers } from 'redux'
import { createMigrate, persistReducer } from 'redux-persist'

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
import analyticsReducer from './analytics'
import leaderboardReducer from './leaderboard'
import dashboardReducer from './dashboard'

const PERSISTED_KEYS: string[] = ['registration', 'view', 'profile', 'dashboard']

const migrations: Record<string, (state: any) => any> = {
  3: (state: any) => state,
  2: (state: any) => {
    const reg = state?.registration
    if (!reg) return state

    if (Array.isArray(reg.entries)) return state

    const entry = reg.name
      ? {
          name: reg.name,
          domain: reg.domain ?? null,
          registrationMode: null,
          quantity: null,
          timeUnit: null,
          customDuration: null,
          calculatedDuration: reg.calculatedDuration ?? null,
          isAvailable: reg.isNameAvailable ?? null,
        }
      : null

    const batch =
      reg.commitTxHash || reg.registerTxHash || reg.commitmentHash
        ? {
            batchIndex: 0,
            nameIndices: [0],
            commitmentHashes: reg.commitmentHash ? [reg.commitmentHash] : null,
            commitTxHash: reg.commitTxHash ?? null,
            commitmentTimestamp: reg.commitmentTimestamp ?? null,
            registerTxHash: reg.registerTxHash ?? null,
            committed: !!reg.commitmentTimestamp,
            registered: reg.flowState === 'success',
          }
        : null

    return {
      ...state,
      registration: {
        isOpen: reg.isOpen ?? false,
        flowState: reg.flowState ?? 'review',
        secret: reg.secret ?? null,
        errorMessage: reg.errorMessage ?? null,
        entries: entry ? [entry] : [],
        registrationMode: reg.registrationMode ?? 'register_for',
        quantity: reg.quantity ?? 1,
        timeUnit: reg.timeUnit ?? 'years',
        customDuration: reg.customDuration ?? 0,
        batches: batch ? [batch] : [],
        currentBatchIndex: 0,
      },
    }
  },
}

const persistConfig = {
  key: 'root',
  whitelist: PERSISTED_KEYS,
  version: 3,
  storage,
  migrate: createMigrate(migrations, { debug: false }),
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
  analytics: analyticsReducer,
  leaderboard: leaderboardReducer,
  dashboard: dashboardReducer,
})

const persistedReducer = persistReducer(persistConfig, reducer)

export default persistedReducer
