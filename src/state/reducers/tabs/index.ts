import { combineReducers } from 'redux'
import managerPanelReducer from './manager'

const tabsReducer = combineReducers({
  managerPanel: managerPanelReducer,
})

export default tabsReducer
