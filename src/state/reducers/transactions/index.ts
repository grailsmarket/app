import { combineReducers } from 'redux'
import transactionBanner from './transactionBanner'

const transactionReducer = combineReducers({
  transactionBannerReducer: transactionBanner,
})

export default transactionReducer
