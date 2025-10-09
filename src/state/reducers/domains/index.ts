import { combineReducers } from 'redux'
import marketplaceDomainsReducer from './marketplaceDomains'

const domainsReducer = combineReducers({
  marketplaceDomains: marketplaceDomainsReducer,
})

export default domainsReducer
