import { combineReducers } from 'redux'
import marketplaceFiltersReducer from './marketplaceFilters'
import marketplaceListingsFiltersReducer from './marketplaceListingsFilters'
import marketplacePremiumFiltersReducer from './marketplacePremiumFilters'
import marketplaceAvailableFiltersReducer from './marketplaceAvailableFilters'
import marketplaceActivityFiltersReducer from './marketplaceActivityFilters'
import categoryDomainsFiltersReducer from './categoryDomainsFilters'
import categoryListingsFiltersReducer from './categoryListingsFilters'
import categoryPremiumFiltersReducer from './categoryPremiumFilters'
import categoryAvailableFiltersReducer from './categoryAvailableFilters'
import categoryActivityFiltersReducer from './categoryActivityFilters'
import categoriesPageFiltersReducer from './categoriesPageFilters'
import categoriesNamesFiltersReducer from './categoriesNamesFilters'
import categoriesListingsFiltersReducer from './categoriesListingsFilters'
import categoriesPremiumDomainsFiltersReducer from './categoriesPremiumDomainsFilters'
import categoriesAvailableDomainsFiltersReducer from './categoriesAvailableDomainsFilters'
import categoriesActivityFiltersReducer from './categoriesActivityFilters'
import bulkSearchFiltersReducer from './bulkSearchFilters'
import feedFiltersReducer from './feedFilters'
import profileFiltersReducer from './profileFilters'

const filtersReducer = combineReducers({
  profileFilters: profileFiltersReducer,
  marketplaceFilters: marketplaceFiltersReducer,
  marketplaceListingsFilters: marketplaceListingsFiltersReducer,
  marketplacePremiumFilters: marketplacePremiumFiltersReducer,
  marketplaceAvailableFilters: marketplaceAvailableFiltersReducer,
  marketplaceActivityFilters: marketplaceActivityFiltersReducer,
  categoryDomainsFilters: categoryDomainsFiltersReducer,
  categoryListingsFilters: categoryListingsFiltersReducer,
  categoryPremiumFilters: categoryPremiumFiltersReducer,
  categoryAvailableFilters: categoryAvailableFiltersReducer,
  categoryActivityFilters: categoryActivityFiltersReducer,
  categoriesPageFilters: categoriesPageFiltersReducer,
  categoriesNamesFilters: categoriesNamesFiltersReducer,
  categoriesListingsFilters: categoriesListingsFiltersReducer,
  categoriesPremiumDomainsFilters: categoriesPremiumDomainsFiltersReducer,
  categoriesAvailableDomainsFilters: categoriesAvailableDomainsFiltersReducer,
  categoriesActivityFilters: categoriesActivityFiltersReducer,
  bulkSearchFilters: bulkSearchFiltersReducer,
  feedFilters: feedFiltersReducer,
})

export default filtersReducer
