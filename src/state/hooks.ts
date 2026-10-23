import { TypedUseSelectorHook, useDispatch, useSelector, useStore } from 'react-redux'
import { AppDispatch, AppState, AppStore } from './index'

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<AppState> = useSelector
export const useAppStore = useStore.withTypes<AppStore>()
