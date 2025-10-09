import { combineReducers } from 'redux'
import changedDomains from './changedDomains'

const cacheReducer = combineReducers({
  changedDomains: changedDomains,
})

export default cacheReducer
