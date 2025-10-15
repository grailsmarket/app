import { combineReducers } from 'redux'
import marketplaceFiltersReducer from './marketplaceFilters'
import myDomainsFiltersReducer from './myDomainsFilters'
import watchlistFiltersReducer from './watchlistFilters'
import myOffersFiltersReducer from './myOffersFilters'
import receivedOffersFiltersReducer from './receivedOffersFilters'

const filtersReducer = combineReducers({
  myOffersFilters: myOffersFiltersReducer,
  myDomainsFilters: myDomainsFiltersReducer,
  watchlistFilters: watchlistFiltersReducer,
  marketplaceFilters: marketplaceFiltersReducer,
  receivedOffersFilters: receivedOffersFiltersReducer,
})

export default filtersReducer
