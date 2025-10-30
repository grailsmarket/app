import { combineReducers } from 'redux'
import quickSearchReducer from './quickSearch'

const searchReducer = combineReducers({
  quickSearch: quickSearchReducer,
})

export default searchReducer
