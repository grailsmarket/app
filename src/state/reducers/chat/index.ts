import { combineReducers } from 'redux'
import chatSidebar from './sidebar'
import chatTyping from './typing'

const chatReducer = combineReducers({
  sidebar: chatSidebar,
  typing: chatTyping,
})

export default chatReducer
