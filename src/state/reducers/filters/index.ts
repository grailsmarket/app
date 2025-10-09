import { combineReducers } from 'redux'
import marketplaceFiltersReducer from './marketplaceFilters'

const filtersReducer = combineReducers({
  marketplaceFilters: marketplaceFiltersReducer,
})

export default filtersReducer
