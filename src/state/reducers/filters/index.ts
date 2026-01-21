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
import profileExpiredFiltersReducer from './profileExpiredFilters'
import profileActivityFiltersReducer from './profileActivityFilters'
import categoryDomainsFiltersReducer from './categoryDomainsFilters'
import categoryPremiumFiltersReducer from './categoryPremiumFilters'
import categoryAvailableFiltersReducer from './categoryAvailableFilters'
import categoryActivityFiltersReducer from './categoryActivityFilters'
import categoriesPageFiltersReducer from './categoriesPageFilters'
import categoriesNamesFiltersReducer from './categoriesNamesFilters'
import categoriesPremiumDomainsFiltersReducer from './categoriesPremiumDomainsFilters'
import categoriesAvailableDomainsFiltersReducer from './categoriesAvailableDomainsFilters'

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
  profileExpiredFilters: profileExpiredFiltersReducer,
  profileActivityFilters: profileActivityFiltersReducer,
  categoryDomainsFilters: categoryDomainsFiltersReducer,
  categoryPremiumFilters: categoryPremiumFiltersReducer,
  categoryAvailableFilters: categoryAvailableFiltersReducer,
  categoryActivityFilters: categoryActivityFiltersReducer,
  categoriesPageFilters: categoriesPageFiltersReducer,
  categoriesNamesFilters: categoriesNamesFiltersReducer,
  categoriesPremiumDomainsFilters: categoriesPremiumDomainsFiltersReducer,
  categoriesAvailableDomainsFilters: categoriesAvailableDomainsFiltersReducer,
})

export default filtersReducer
