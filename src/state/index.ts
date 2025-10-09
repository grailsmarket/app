import { configureStore } from '@reduxjs/toolkit'
import { persistStore } from 'redux-persist'
import persistedReducer from './reducers'

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: true,
      immutableCheck: true,
      serializableCheck: false,
    }),
})

export const persistor = persistStore(store)

export type RootState = ReturnType<typeof store.getState>
export type AppState = ReturnType<typeof persistedReducer>
export type AppDispatch = typeof store.dispatch

export default store
