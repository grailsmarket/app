import { combineReducers } from 'redux'
import quickSearchReducer from './quickSearch'
import marketplaceSearchReducer from './marketplaceSearch'

const searchReducer = combineReducers({
  marketplaceSearch: marketplaceSearchReducer,
  quickSearch: quickSearchReducer,
})

export default searchReducer
