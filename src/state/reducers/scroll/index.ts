import { combineReducers } from 'redux'
import scrollPosition from './scrollPosition'

const scrollReducer = combineReducers({
  position: scrollPosition,
})

export default scrollReducer
