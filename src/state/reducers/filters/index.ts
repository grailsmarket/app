import { combineReducers } from 'redux'
import marketplaceFiltersReducer from './marketplaceFilters'
import marketplaceActivityFiltersReducer from './marketplaceActivityFilters'
import myDomainsFiltersReducer from './myDomainsFilters'
import watchlistFiltersReducer from './watchlistFilters'
import myOffersFiltersReducer from './myOffersFilters'
import receivedOffersFiltersReducer from './receivedOffersFilters'
import profileListingsFiltersReducer from './profileListingsFilter'
import profileDomainsFiltersReducer from './profileDomainsFilters'
import profileActivityFiltersReducer from './profileActivityFilters'
import categoryDomainsFiltersReducer from './categoryDomainsFilters'
import categoryPremiumFiltersReducer from './categoryPremiumFilters'
import categoryAvailableFiltersReducer from './categoryAvailableFilters'
import categoryActivityFiltersReducer from './categoryActivityFilters'

const filtersReducer = combineReducers({
  myOffersFilters: myOffersFiltersReducer,
  myDomainsFilters: myDomainsFiltersReducer,
  watchlistFilters: watchlistFiltersReducer,
  marketplaceFilters: marketplaceFiltersReducer,
  marketplaceActivityFilters: marketplaceActivityFiltersReducer,
  receivedOffersFilters: receivedOffersFiltersReducer,
  profileDomainsFilters: profileDomainsFiltersReducer,
  profileListingsFilters: profileListingsFiltersReducer,
  profileActivityFilters: profileActivityFiltersReducer,
  categoryDomainsFilters: categoryDomainsFiltersReducer,
  categoryPremiumFilters: categoryPremiumFiltersReducer,
  categoryAvailableFilters: categoryAvailableFiltersReducer,
  categoryActivityFilters: categoryActivityFiltersReducer,
})

export default filtersReducer
