import { combineReducers } from 'redux'
import marketplaceFiltersReducer from './marketplaceFilters'
import myDomainsFiltersReducer from './myDomainsFilters'
import watchlistFiltersReducer from './watchlistFilters'
import myOffersFiltersReducer from './myOffersFilters'
import receivedOffersFiltersReducer from './receivedOffersFilters'
import profileDomainsFiltersReducer from './profileDomainsFilters'
import profileActivityFiltersReducer from './profileActivityFilters'
import clubDomainsFiltersReducer from './clubDomainsFilters'

const filtersReducer = combineReducers({
  myOffersFilters: myOffersFiltersReducer,
  myDomainsFilters: myDomainsFiltersReducer,
  watchlistFilters: watchlistFiltersReducer,
  marketplaceFilters: marketplaceFiltersReducer,
  receivedOffersFilters: receivedOffersFiltersReducer,
  profileDomainsFilters: profileDomainsFiltersReducer,
  profileActivityFilters: profileActivityFiltersReducer,
  clubDomainsFilters: clubDomainsFiltersReducer,
})

export default filtersReducer
