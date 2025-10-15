import { combineReducers } from 'redux'
import marketplaceFiltersReducer from './marketplaceFilters'
import myDomainsFiltersReducer from './myDomainsFilters'

const filtersReducer = combineReducers({
  marketplaceFilters: marketplaceFiltersReducer,
  myDomainsFilters: myDomainsFiltersReducer,
})

export default filtersReducer
