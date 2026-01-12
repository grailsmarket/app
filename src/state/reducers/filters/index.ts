import { combineReducers } from 'redux'
import marketplaceFiltersReducer from './marketplaceFilters'
import marketplacePremiumFiltersReducer from './marketplacePremiumFilters'
import marketplaceAvailableFiltersReducer from './marketplaceAvailableFilters'
import marketplaceActivityFiltersReducer from './marketplaceActivityFilters'
import myDomainsFiltersReducer from './myDomainsFilters'
import watchlistFiltersReducer from './watchlistFilters'
import myOffersFiltersReducer from './myOffersFilters'
import receivedOffersFiltersReducer from './receivedOffersFilters'
import profileListingsFiltersReducer from './profileListingsFilter'
import profileDomainsFiltersReducer from './profileDomainsFilters'
import profileGraceFiltersReducer from './profileGraceFilters'
import profileActivityFiltersReducer from './profileActivityFilters'
import categoryDomainsFiltersReducer from './categoryDomainsFilters'
import categoryPremiumFiltersReducer from './categoryPremiumFilters'
import categoryAvailableFiltersReducer from './categoryAvailableFilters'
import categoryActivityFiltersReducer from './categoryActivityFilters'
import categoriesPageFiltersReducer from './categoriesPageFilters'

const filtersReducer = combineReducers({
  myOffersFilters: myOffersFiltersReducer,
  myDomainsFilters: myDomainsFiltersReducer,
  watchlistFilters: watchlistFiltersReducer,
  marketplaceFilters: marketplaceFiltersReducer,
  marketplacePremiumFilters: marketplacePremiumFiltersReducer,
  marketplaceAvailableFilters: marketplaceAvailableFiltersReducer,
  marketplaceActivityFilters: marketplaceActivityFiltersReducer,
  receivedOffersFilters: receivedOffersFiltersReducer,
  profileDomainsFilters: profileDomainsFiltersReducer,
  profileGraceFilters: profileGraceFiltersReducer,
  profileListingsFilters: profileListingsFiltersReducer,
  profileActivityFilters: profileActivityFiltersReducer,
  categoryDomainsFilters: categoryDomainsFiltersReducer,
  categoryPremiumFilters: categoryPremiumFiltersReducer,
  categoryAvailableFilters: categoryAvailableFiltersReducer,
  categoryActivityFilters: categoryActivityFiltersReducer,
  categoriesPageFilters: categoriesPageFiltersReducer,
})

export default filtersReducer
