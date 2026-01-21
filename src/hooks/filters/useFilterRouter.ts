import _ from 'lodash'
import { RootState } from '@/state'
import { useAppSelector } from '@/state/hooks'
import { useFilterContext } from '@/context/filters'
import { FilterRouter, FilterContextType } from '@/types/filters'
import { selectFilterPanel, setFilterPanelOpen } from '@/state/reducers/filterPanel'

// Import marketplace selectors and actions
import {
  emptyFilterState as emptyFilterStateMarketplaceFilters,
  selectMarketplaceFilters,
  setMarketplaceFiltersOpen,
  toggleMarketplaceFiltersStatus,
  setMarketplaceFiltersStatus,
  toggleMarketplaceFiltersType,
  setMarketplaceFiltersType,
  setMarketplaceMarketFilters,
  setMarketplaceTextMatchFilters,
  setMarketplaceTextNonMatchFilters,
  setMarketplaceFiltersLength,
  setMarketplacePriceDenomination,
  setMarketplacePriceRange,
  toggleMarketplaceCategory,
  setMarketplaceFiltersCategory,
  addMarketplaceCategories,
  removeMarketplaceCategories,
  setMarketplaceSort,
  setMarketplaceSearch,
  setMarketplaceScrollTop,
  toggleMarketplaceFilterOpen,
  clearMarketplaceFilters,
} from '@/state/reducers/filters/marketplaceFilters'

// Import marketplace activity filters selectors and actions
import {
  emptyFilterState as emptyFilterStateMarketplaceActivityFilters,
  selectMarketplaceActivityFilters,
  toggleMarketplaceActivityFiltersType,
  setMarketplaceActivityFiltersType,
  toggleMarketplaceActivityFilterOpen,
  setMarketplaceActivityFiltersOpen,
  setMarketplaceActivitySearch,
  setMarketplaceActivityFiltersScrollTop,
  clearMarketplaceActivityFilters,
} from '@/state/reducers/filters/marketplaceActivityFilters'

// Import marketplace premium filters selectors and actions
import {
  emptyFilterState as emptyFilterStateMarketplacePremiumFilters,
  selectMarketplacePremiumFilters,
  setFiltersOpen as setMarketplacePremiumFiltersOpen,
  toggleFiltersType as toggleMarketplacePremiumFiltersType,
  setFiltersType as setMarketplacePremiumFiltersType,
  setMarketFilters as setMarketplacePremiumMarketFilters,
  setTextMatchFilters as setMarketplacePremiumTextMatchFilters,
  setTextNonMatchFilters as setMarketplacePremiumTextNonMatchFilters,
  setFiltersLength as setMarketplacePremiumFiltersLength,
  setPriceDenomination as setMarketplacePremiumPriceDenomination,
  setPriceRange as setMarketplacePremiumPriceRange,
  toggleCategory as toggleMarketplacePremiumCategory,
  setFiltersCategory as setMarketplacePremiumFiltersCategory,
  addCategories as addMarketplacePremiumCategories,
  removeCategories as removeMarketplacePremiumCategories,
  setSort as setMarketplacePremiumSort,
  setSearch as setMarketplacePremiumSearch,
  setFiltersScrollTop as setMarketplacePremiumFiltersScrollTop,
  toggleFilterOpen as toggleMarketplacePremiumFilterOpen,
  clearFilters as clearMarketplacePremiumFilters,
} from '@/state/reducers/filters/marketplacePremiumFilters'

// Import marketplace available filters selectors and actions
import {
  emptyFilterState as emptyFilterStateMarketplaceAvailableFilters,
  selectMarketplaceAvailableFilters,
  setFiltersOpen as setMarketplaceAvailableFiltersOpen,
  toggleFiltersType as toggleMarketplaceAvailableFiltersType,
  setFiltersType as setMarketplaceAvailableFiltersType,
  setMarketFilters as setMarketplaceAvailableMarketFilters,
  setTextMatchFilters as setMarketplaceAvailableTextMatchFilters,
  setTextNonMatchFilters as setMarketplaceAvailableTextNonMatchFilters,
  setFiltersLength as setMarketplaceAvailableFiltersLength,
  setPriceDenomination as setMarketplaceAvailablePriceDenomination,
  setPriceRange as setMarketplaceAvailablePriceRange,
  toggleCategory as toggleMarketplaceAvailableCategory,
  setFiltersCategory as setMarketplaceAvailableFiltersCategory,
  addCategories as addMarketplaceAvailableCategories,
  removeCategories as removeMarketplaceAvailableCategories,
  setSort as setMarketplaceAvailableSort,
  setSearch as setMarketplaceAvailableSearch,
  setFiltersScrollTop as setMarketplaceAvailableFiltersScrollTop,
  toggleFilterOpen as toggleMarketplaceAvailableFilterOpen,
  clearFilters as clearMarketplaceAvailableFilters,
} from '@/state/reducers/filters/marketplaceAvailableFilters'

// Import marketplace state selector
import { selectMarketplace } from '@/state/reducers/marketplace/marketplace'

// Import myOffers selectors and actions
import {
  emptyFilterState as emptyFilterStateMyOffersFilters,
  selectMyOffersFilters,
  setMyOffersFiltersOpen,
  toggleMyOffersFiltersStatus,
  setMyOffersFiltersStatus,
  toggleMyOffersFiltersType,
  setMyOffersFiltersType,
  setMyOffersMarketFilters,
  setMyOffersTextMatchFilters,
  setMyOffersTextNonMatchFilters,
  setMyOffersFiltersLength,
  setMyOffersPriceDenomination,
  setMyOffersPriceRange,
  toggleMyOffersCategory,
  setMyOffersFiltersCategory,
  addMyOffersCategories,
  removeMyOffersCategories,
  setMyOffersSort,
  setMyOffersSearch,
  setMyOffersScrollTop,
  toggleMyOffersFilterOpen,
  clearMyOffersFilters,
} from '@/state/reducers/filters/myOffersFilters'

// Import receivedOffers selectors and actions
import {
  emptyFilterState as emptyFilterStateReceivedOffersFilters,
  selectReceivedOffersFilters,
  setReceivedOffersFiltersOpen,
  toggleReceivedOffersFiltersStatus,
  setReceivedOffersFiltersStatus,
  toggleReceivedOffersFiltersType,
  setReceivedOffersFiltersType,
  setReceivedOffersMarketFilters,
  setReceivedOffersTextMatchFilters,
  setReceivedOffersTextNonMatchFilters,
  setReceivedOffersFiltersLength,
  setReceivedOffersPriceDenomination,
  setReceivedOffersPriceRange,
  toggleReceivedOffersCategory,
  setReceivedOffersFiltersCategory,
  addReceivedOffersCategories,
  removeReceivedOffersCategories,
  setReceivedOffersSort,
  setReceivedOffersSearch,
  setReceivedOffersScrollTop,
  toggleReceivedOffersFilterOpen,
  clearReceivedOffersFilters,
} from '@/state/reducers/filters/receivedOffersFilters'

// Import watchlist selectors and actions
import {
  emptyFilterState as emptyFilterStateWatchlistFilters,
  selectWatchlistFilters,
  setWatchlistFiltersOpen,
  toggleWatchlistFiltersStatus,
  setWatchlistFiltersStatus,
  toggleWatchlistFiltersType,
  setWatchlistFiltersType,
  setWatchlistMarketFilters,
  setWatchlistTextMatchFilters,
  setWatchlistTextNonMatchFilters,
  setWatchlistFiltersLength,
  setWatchlistPriceDenomination,
  setWatchlistPriceRange,
  toggleWatchlistCategory,
  setWatchlistFiltersCategory,
  addWatchlistCategories,
  removeWatchlistCategories,
  setWatchlistSort,
  setWatchlistSearch,
  setWatchlistFiltersScrollTop,
  toggleWatchlistFilterOpen,
  clearWatchlistFilters,
} from '@/state/reducers/filters/watchlistFilters'

// Import profile selector for portfolio tabs
import { selectUserProfile } from '@/state/reducers/portfolio/profile'
import { useMemo } from 'react'

// Import profile filters selectors and actions
import {
  emptyFilterState as emptyFilterStateProfileDomainsFilters,
  selectProfileDomainsFilters,
  setFiltersOpen as setProfileDomainsFiltersOpen,
  toggleFiltersStatus as toggleProfileDomainsFiltersStatus,
  setFiltersStatus as setProfileDomainsFiltersStatus,
  toggleFiltersType as toggleProfileDomainsFiltersType,
  setFiltersType as setProfileDomainsFiltersType,
  setMarketFilters as setProfileDomainsMarketFilters,
  setProfileDomainsTextMatchFilters,
  setProfileDomainsTextNonMatchFilters,
  setFiltersLength as setProfileDomainsFiltersLength,
  setPriceDenomination as setProfileDomainsPriceDenomination,
  setPriceRange as setProfileDomainsPriceRange,
  toggleCategory as toggleProfileDomainsCategory,
  setFiltersCategory as setProfileDomainsFiltersCategory,
  addCategories as addProfileDomainsCategories,
  removeCategories as removeProfileDomainsCategories,
  setSort as setProfileDomainsSort,
  setSearch as setProfileDomainsSearch,
  setFiltersScrollTop as setProfileDomainsFiltersScrollTop,
  toggleFilterOpen as toggleProfileDomainsFilterOpen,
  clearFilters as clearProfileDomainsFilters,
} from '@/state/reducers/filters/profileDomainsFilters'

import {
  emptyFilterState as emptyFilterStateProfileListingsFilters,
  setFiltersOpen as setProfileListingsFiltersOpen,
  toggleFiltersType as toggleProfileListingsFiltersType,
  setFiltersType as setProfileListingsFiltersType,
  setMarketFilters as setProfileListingsMarketFilters,
  setTextMatchFilters as setProfileListingsTextMatchFilters,
  setTextNonMatchFilters as setProfileListingsTextNonMatchFilters,
  setFiltersLength as setProfileListingsFiltersLength,
  setPriceDenomination as setProfileListingsPriceDenomination,
  setPriceRange as setProfileListingsPriceRange,
  toggleCategory as toggleProfileListingsCategory,
  setFiltersCategory as setProfileListingsFiltersCategory,
  addCategories as addProfileListingsCategories,
  removeCategories as removeProfileListingsCategories,
  setSort as setProfileListingsSort,
  setSearch as setProfileListingsSearch,
  setFiltersScrollTop as setProfileListingsFiltersScrollTop,
  toggleFilterOpen as toggleProfileListingsFilterOpen,
  clearFilters as clearProfileListingsFilters,
  selectProfileListingsFilters,
} from '@/state/reducers/filters/profileListingsFilter'

import {
  emptyFilterState as emptyFilterStateProfileActivityFilters,
  selectProfileActivityFilters,
  toggleActivityFiltersType,
  setActivityFiltersType,
  toggleFilterOpen as toggleProfileActivityFilterOpen,
  setFiltersOpen as setProfileActivityFilterOpen,
  setSearch as setProfileActivitySearch,
  setFiltersScrollTop as setProfileActivityFiltersScrollTop,
  clearActivityFilters,
} from '@/state/reducers/filters/profileActivityFilters'

// Import profile grace filters selectors and actions
import {
  emptyFilterState as emptyFilterStateProfileGraceFilters,
  selectProfileGraceFilters,
  setFiltersOpen as setProfileGraceFiltersOpen,
  toggleFiltersType as toggleProfileGraceFiltersType,
  setFiltersType as setProfileGraceFiltersType,
  setMarketFilters as setProfileGraceMarketFilters,
  setProfileGraceTextMatchFilters,
  setProfileGraceTextNonMatchFilters,
  setFiltersLength as setProfileGraceFiltersLength,
  setPriceDenomination as setProfileGracePriceDenomination,
  setPriceRange as setProfileGracePriceRange,
  toggleCategory as toggleProfileGraceCategory,
  setFiltersCategory as setProfileGraceFiltersCategory,
  addCategories as addProfileGraceCategories,
  removeCategories as removeProfileGraceCategories,
  setSort as setProfileGraceSort,
  setSearch as setProfileGraceSearch,
  setFiltersScrollTop as setProfileGraceFiltersScrollTop,
  toggleFilterOpen as toggleProfileGraceFilterOpen,
  clearFilters as clearProfileGraceFilters,
} from '@/state/reducers/filters/profileGraceFilters'

// Import profile expired filters selectors and actions
import {
  emptyFilterState as emptyFilterStateProfileExpiredFilters,
  selectProfileExpiredFilters,
  setFiltersOpen as setProfileExpiredFiltersOpen,
  toggleFiltersType as toggleProfileExpiredFiltersType,
  setFiltersType as setProfileExpiredFiltersType,
  setMarketFilters as setProfileExpiredMarketFilters,
  setTextMatchFilters as setProfileExpiredTextMatchFilters,
  setTextNonMatchFilters as setProfileExpiredTextNonMatchFilters,
  setFiltersLength as setProfileExpiredFiltersLength,
  setPriceDenomination as setProfileExpiredPriceDenomination,
  setPriceRange as setProfileExpiredPriceRange,
  toggleCategory as toggleProfileExpiredCategory,
  setFiltersCategory as setProfileExpiredFiltersCategory,
  addCategories as addProfileExpiredCategories,
  removeCategories as removeProfileExpiredCategories,
  setSort as setProfileExpiredSort,
  setSearch as setProfileExpiredSearch,
  setFiltersScrollTop as setProfileExpiredFiltersScrollTop,
  toggleFilterOpen as toggleProfileExpiredFilterOpen,
  clearFilters as clearProfileExpiredFilters,
} from '@/state/reducers/filters/profileExpiredFilters'

// Import categoryDomains selectors and actions
import {
  emptyFilterState as emptyFilterStateCategoryDomainsFilters,
  selectCategoryDomainsFilters,
  setFiltersOpen as setCategoryDomainsFiltersOpen,
  toggleFiltersStatus as toggleCategoryDomainsFiltersStatus,
  setFiltersStatus as setCategoryDomainsFiltersStatus,
  toggleFiltersType as toggleCategoryDomainsFiltersType,
  setFiltersType as setCategoryDomainsFiltersType,
  setMarketFilters as setCategoryDomainsMarketFilters,
  setTextMatchFilters as setCategoryDomainsTextMatchFilters,
  setTextNonMatchFilters as setCategoryDomainsTextNonMatchFilters,
  setFiltersLength as setCategoryDomainsFiltersLength,
  setPriceDenomination as setCategoryDomainsPriceDenomination,
  setPriceRange as setCategoryDomainsPriceRange,
  toggleCategory as toggleCategoryDomainsCategory,
  setFiltersCategory as setCategoryDomainsFiltersCategory,
  addCategories as addCategoryDomainsCategories,
  removeCategories as removeCategoryDomainsCategories,
  setSort as setCategoryDomainsSort,
  setSearch as setCategoryDomainsSearch,
  setFiltersScrollTop as setCategoryDomainsFiltersScrollTop,
  toggleFilterOpen as toggleCategoryDomainsFilterOpen,
  clearFilters as clearCategoryDomainsFilters,
} from '@/state/reducers/filters/categoryDomainsFilters'

// Import categoryPremium selectors and actions
import {
  emptyFilterState as emptyFilterStateCategoryPremiumFilters,
  selectCategoryPremiumFilters,
  setFiltersOpen as setCategoryPremiumFiltersOpen,
  toggleFiltersType as toggleCategoryPremiumFiltersType,
  setFiltersType as setCategoryPremiumFiltersType,
  setMarketFilters as setCategoryPremiumMarketFilters,
  setTextMatchFilters as setCategoryPremiumTextMatchFilters,
  setTextNonMatchFilters as setCategoryPremiumTextNonMatchFilters,
  setFiltersLength as setCategoryPremiumFiltersLength,
  setPriceDenomination as setCategoryPremiumPriceDenomination,
  setPriceRange as setCategoryPremiumPriceRange,
  toggleCategory as toggleCategoryPremiumCategory,
  setFiltersCategory as setCategoryPremiumFiltersCategory,
  addCategories as addCategoryPremiumCategories,
  removeCategories as removeCategoryPremiumCategories,
  setSort as setCategoryPremiumSort,
  setSearch as setCategoryPremiumSearch,
  setFiltersScrollTop as setCategoryPremiumFiltersScrollTop,
  toggleFilterOpen as toggleCategoryPremiumFilterOpen,
  clearFilters as clearCategoryPremiumFilters,
} from '@/state/reducers/filters/categoryPremiumFilters'

// Import categoryAvailable selectors and actions
import {
  emptyFilterState as emptyFilterStateCategoryAvailableFilters,
  selectCategoryAvailableFilters,
  setFiltersOpen as setCategoryAvailableFiltersOpen,
  toggleFiltersType as toggleCategoryAvailableFiltersType,
  setFiltersType as setCategoryAvailableFiltersType,
  setMarketFilters as setCategoryAvailableMarketFilters,
  setTextMatchFilters as setCategoryAvailableTextMatchFilters,
  setTextNonMatchFilters as setCategoryAvailableTextNonMatchFilters,
  setFiltersLength as setCategoryAvailableFiltersLength,
  setPriceDenomination as setCategoryAvailablePriceDenomination,
  setPriceRange as setCategoryAvailablePriceRange,
  toggleCategory as toggleCategoryAvailableCategory,
  setFiltersCategory as setCategoryAvailableFiltersCategory,
  addCategories as addCategoryAvailableCategories,
  removeCategories as removeCategoryAvailableCategories,
  setSort as setCategoryAvailableSort,
  setSearch as setCategoryAvailableSearch,
  setFiltersScrollTop as setCategoryAvailableFiltersScrollTop,
  toggleFilterOpen as toggleCategoryAvailableFilterOpen,
  clearFilters as clearCategoryAvailableFilters,
} from '@/state/reducers/filters/categoryAvailableFilters'

// Import categoryActivity selectors and actions
import {
  emptyFilterState as emptyFilterStateCategoryActivityFilters,
  selectCategoryActivityFilters,
  toggleActivityFiltersType as toggleCategoryActivityFiltersType,
  setActivityFiltersType as setCategoryActivityFiltersType,
  toggleFilterOpen as toggleCategoryActivityFilterOpen,
  setFiltersOpen as setCategoryActivityFiltersOpen,
  setSearch as setCategoryActivitySearch,
  setFiltersScrollTop as setCategoryActivityFiltersScrollTop,
  clearActivityFilters as clearCategoryActivityFilters,
} from '@/state/reducers/filters/categoryActivityFilters'

// Import category state selector
import { selectCategory } from '@/state/reducers/category/category'

// Import categoriesPage state selector
import { selectCategoriesPage } from '@/state/reducers/categoriesPage/categoriesPage'

// Import categoriesNamesFilters selectors and actions
import {
  emptyFilterState as emptyFilterStateCategoriesNamesFilters,
  selectCategoriesNamesFilters,
  setFiltersOpen as setCategoriesNamesFiltersOpen,
  toggleFiltersStatus as toggleCategoriesNamesFiltersStatus,
  setFiltersStatus as setCategoriesNamesFiltersStatus,
  toggleFiltersType as toggleCategoriesNamesFiltersType,
  setFiltersType as setCategoriesNamesFiltersType,
  setMarketFilters as setCategoriesNamesMarketFilters,
  setTextMatchFilters as setCategoriesNamesTextMatchFilters,
  setTextNonMatchFilters as setCategoriesNamesTextNonMatchFilters,
  setFiltersLength as setCategoriesNamesFiltersLength,
  setPriceDenomination as setCategoriesNamesPriceDenomination,
  setPriceRange as setCategoriesNamesPriceRange,
  toggleCategory as toggleCategoriesNamesCategory,
  setFiltersCategory as setCategoriesNamesFiltersCategory,
  addCategories as addCategoriesNamesCategories,
  removeCategories as removeCategoriesNamesCategories,
  setSort as setCategoriesNamesSort,
  setSearch as setCategoriesNamesSearch,
  setFiltersScrollTop as setCategoriesNamesFiltersScrollTop,
  toggleFilterOpen as toggleCategoriesNamesFilterOpen,
  clearFilters as clearCategoriesNamesFilters,
} from '@/state/reducers/filters/categoriesNamesFilters'

// Import categoriesPremiumDomainsFilters selectors and actions
import {
  emptyFilterState as emptyFilterStateCategoriesPremiumDomainsFilters,
  selectCategoriesPremiumDomainsFilters,
  setFiltersOpen as setCategoriesPremiumDomainsFiltersOpen,
  toggleFiltersType as toggleCategoriesPremiumDomainsFiltersType,
  setFiltersType as setCategoriesPremiumDomainsFiltersType,
  setMarketFilters as setCategoriesPremiumDomainsMarketFilters,
  setTextMatchFilters as setCategoriesPremiumDomainsTextMatchFilters,
  setTextNonMatchFilters as setCategoriesPremiumDomainsTextNonMatchFilters,
  setFiltersLength as setCategoriesPremiumDomainsFiltersLength,
  setPriceDenomination as setCategoriesPremiumDomainsPriceDenomination,
  setPriceRange as setCategoriesPremiumDomainsPriceRange,
  toggleCategory as toggleCategoriesPremiumDomainsCategory,
  setFiltersCategory as setCategoriesPremiumDomainsFiltersCategory,
  addCategories as addCategoriesPremiumDomainsCategories,
  removeCategories as removeCategoriesPremiumDomainsCategories,
  setSort as setCategoriesPremiumDomainsSort,
  setSearch as setCategoriesPremiumDomainsSearch,
  setFiltersScrollTop as setCategoriesPremiumDomainsFiltersScrollTop,
  toggleFilterOpen as toggleCategoriesPremiumDomainsFilterOpen,
  clearFilters as clearCategoriesPremiumDomainsFilters,
} from '@/state/reducers/filters/categoriesPremiumDomainsFilters'

// Import categoriesAvailableDomainsFilters selectors and actions
import {
  emptyFilterState as emptyFilterStateCategoriesAvailableDomainsFilters,
  selectCategoriesAvailableDomainsFilters,
  setFiltersOpen as setCategoriesAvailableDomainsFiltersOpen,
  toggleFiltersType as toggleCategoriesAvailableDomainsFiltersType,
  setFiltersType as setCategoriesAvailableDomainsFiltersType,
  setMarketFilters as setCategoriesAvailableDomainsMarketFilters,
  setTextMatchFilters as setCategoriesAvailableDomainsTextMatchFilters,
  setTextNonMatchFilters as setCategoriesAvailableDomainsTextNonMatchFilters,
  setFiltersLength as setCategoriesAvailableDomainsFiltersLength,
  setPriceDenomination as setCategoriesAvailableDomainsPriceDenomination,
  setPriceRange as setCategoriesAvailableDomainsPriceRange,
  toggleCategory as toggleCategoriesAvailableDomainsCategory,
  setFiltersCategory as setCategoriesAvailableDomainsFiltersCategory,
  addCategories as addCategoriesAvailableDomainsCategories,
  removeCategories as removeCategoriesAvailableDomainsCategories,
  setSort as setCategoriesAvailableDomainsSort,
  setSearch as setCategoriesAvailableDomainsSearch,
  setFiltersScrollTop as setCategoriesAvailableDomainsFiltersScrollTop,
  toggleFilterOpen as toggleCategoriesAvailableDomainsFilterOpen,
  clearFilters as clearCategoriesAvailableDomainsFilters,
} from '@/state/reducers/filters/categoriesAvailableDomainsFilters'

// Import categoriesPage selectors and actions
import {
  emptyFilterState as emptyFilterStateCategoriesPageFilters,
  selectCategoriesPageFilters,
  setCategoriesPageFiltersOpen,
  setCategoriesPageSearch,
  toggleCategoriesPageType,
  setCategoriesPageType,
  setCategoriesPageSort,
  setCategoriesPageSortDirection,
  toggleCategoriesPageFilterOpen,
  setCategoriesPageScrollTop,
  clearCategoriesPageFilters,
} from '@/state/reducers/filters/categoriesPageFilters'

export function useFilterRouter(): FilterRouter<FilterContextType> {
  const { filterType } = useFilterContext()
  const profileState = useAppSelector(selectUserProfile)
  const marketplaceState = useAppSelector(selectMarketplace)
  const categoryState = useAppSelector(selectCategory)
  const categoriesPageState = useAppSelector(selectCategoriesPage)
  const filterPanelState = useAppSelector(selectFilterPanel)

  // Determine which tab is active in profile
  const activeProfileTab = profileState.selectedTab?.value || 'domains'
  // Determine which tab is active in marketplace
  const activeMarketplaceTab = marketplaceState.selectedTab?.value || 'names'
  // Determine which tab is active in category
  const activeCategoryTab = categoryState.selectedTab?.value || 'names'
  // Determine which tab is active in categoriesPage
  const activeCategoriesPageTab = categoriesPageState.categoriesPage.selectedTab?.value || 'categories'

  // Select appropriate filters depending on context
  const filters = useAppSelector((state: RootState) => {
    if (filterType === 'categoriesPage') {
      if (activeCategoriesPageTab === 'categories') {
        return selectCategoriesPageFilters(state)
      } else if (activeCategoriesPageTab === 'names') {
        return selectCategoriesNamesFilters(state)
      } else if (activeCategoriesPageTab === 'premium') {
        return selectCategoriesPremiumDomainsFilters(state)
      } else if (activeCategoriesPageTab === 'available') {
        return selectCategoriesAvailableDomainsFilters(state)
      }
      return selectCategoriesPageFilters(state)
    }

    if (filterType === 'category') {
      if (activeCategoryTab === 'names') {
        return selectCategoryDomainsFilters(state)
      } else if (activeCategoryTab === 'premium') {
        return selectCategoryPremiumFilters(state)
      } else if (activeCategoryTab === 'available') {
        return selectCategoryAvailableFilters(state)
      } else if (activeCategoryTab === 'activity') {
        return selectCategoryActivityFilters(state)
      }
      return selectCategoryDomainsFilters(state)
    }

    if (filterType === 'marketplace') {
      if (activeMarketplaceTab === 'names') {
        return selectMarketplaceFilters(state)
      } else if (activeMarketplaceTab === 'premium') {
        return selectMarketplacePremiumFilters(state)
      } else if (activeMarketplaceTab === 'available') {
        return selectMarketplaceAvailableFilters(state)
      } else if (activeMarketplaceTab === 'activity') {
        return selectMarketplaceActivityFilters(state)
      }
      return selectMarketplaceFilters(state)
    }

    if (filterType === 'profile') {
      if (activeProfileTab === 'domains') {
        return selectProfileDomainsFilters(state)
      } else if (activeProfileTab === 'listings') {
        return selectProfileListingsFilters(state)
      } else if (activeProfileTab === 'grace') {
        return selectProfileGraceFilters(state)
      } else if (activeProfileTab === 'expired') {
        return selectProfileExpiredFilters(state)
      } else if (activeProfileTab === 'received_offers') {
        return selectReceivedOffersFilters(state)
      } else if (activeProfileTab === 'sent_offers') {
        return selectMyOffersFilters(state)
      } else if (activeProfileTab === 'watchlist') {
        return selectWatchlistFilters(state)
      } else if (activeProfileTab === 'activity') {
        return selectProfileActivityFilters(state)
      }

      return selectProfileDomainsFilters(state)
    }

    return selectMarketplaceFilters(state)
  })

  // Return the appropriate actions based on context
  const actions = useMemo(() => {
    if (filterType === 'categoriesPage') {
      if (activeCategoriesPageTab === 'categories') {
        return {
          setFiltersOpen: setCategoriesPageFiltersOpen,
          setSearch: setCategoriesPageSearch,
          toggleFiltersType: toggleCategoriesPageType,
          setFiltersType: setCategoriesPageType,
          setSort: setCategoriesPageSort,
          setSortDirection: setCategoriesPageSortDirection,
          setScrollTop: setCategoriesPageScrollTop,
          toggleFilterOpen: toggleCategoriesPageFilterOpen,
          clearFilters: clearCategoriesPageFilters,
        } as any
      } else if (activeCategoriesPageTab === 'names') {
        return {
          setFiltersOpen: setCategoriesNamesFiltersOpen,
          toggleFiltersStatus: toggleCategoriesNamesFiltersStatus,
          setFiltersStatus: setCategoriesNamesFiltersStatus,
          toggleFiltersType: toggleCategoriesNamesFiltersType,
          setFiltersType: setCategoriesNamesFiltersType,
          setMarketFilters: setCategoriesNamesMarketFilters,
          setTextMatchFilters: setCategoriesNamesTextMatchFilters,
          setTextNonMatchFilters: setCategoriesNamesTextNonMatchFilters,
          setFiltersLength: setCategoriesNamesFiltersLength,
          setPriceDenomination: setCategoriesNamesPriceDenomination,
          setPriceRange: setCategoriesNamesPriceRange,
          toggleCategory: toggleCategoriesNamesCategory,
          setFiltersCategory: setCategoriesNamesFiltersCategory,
          addCategories: addCategoriesNamesCategories,
          removeCategories: removeCategoriesNamesCategories,
          setSort: setCategoriesNamesSort,
          setSearch: setCategoriesNamesSearch,
          setScrollTop: setCategoriesNamesFiltersScrollTop,
          toggleFilterOpen: toggleCategoriesNamesFilterOpen,
          clearFilters: clearCategoriesNamesFilters,
        }
      } else if (activeCategoriesPageTab === 'premium') {
        return {
          setFiltersOpen: setCategoriesPremiumDomainsFiltersOpen,
          toggleFiltersType: toggleCategoriesPremiumDomainsFiltersType,
          setFiltersType: setCategoriesPremiumDomainsFiltersType,
          setMarketFilters: setCategoriesPremiumDomainsMarketFilters,
          setTextMatchFilters: setCategoriesPremiumDomainsTextMatchFilters,
          setTextNonMatchFilters: setCategoriesPremiumDomainsTextNonMatchFilters,
          setFiltersLength: setCategoriesPremiumDomainsFiltersLength,
          setPriceDenomination: setCategoriesPremiumDomainsPriceDenomination,
          setPriceRange: setCategoriesPremiumDomainsPriceRange,
          toggleCategory: toggleCategoriesPremiumDomainsCategory,
          setFiltersCategory: setCategoriesPremiumDomainsFiltersCategory,
          addCategories: addCategoriesPremiumDomainsCategories,
          removeCategories: removeCategoriesPremiumDomainsCategories,
          setSort: setCategoriesPremiumDomainsSort,
          setSearch: setCategoriesPremiumDomainsSearch,
          setScrollTop: setCategoriesPremiumDomainsFiltersScrollTop,
          toggleFilterOpen: toggleCategoriesPremiumDomainsFilterOpen,
          clearFilters: clearCategoriesPremiumDomainsFilters,
        }
      } else if (activeCategoriesPageTab === 'available') {
        return {
          setFiltersOpen: setCategoriesAvailableDomainsFiltersOpen,
          toggleFiltersType: toggleCategoriesAvailableDomainsFiltersType,
          setFiltersType: setCategoriesAvailableDomainsFiltersType,
          setMarketFilters: setCategoriesAvailableDomainsMarketFilters,
          setTextMatchFilters: setCategoriesAvailableDomainsTextMatchFilters,
          setTextNonMatchFilters: setCategoriesAvailableDomainsTextNonMatchFilters,
          setFiltersLength: setCategoriesAvailableDomainsFiltersLength,
          setPriceDenomination: setCategoriesAvailableDomainsPriceDenomination,
          setPriceRange: setCategoriesAvailableDomainsPriceRange,
          toggleCategory: toggleCategoriesAvailableDomainsCategory,
          setFiltersCategory: setCategoriesAvailableDomainsFiltersCategory,
          addCategories: addCategoriesAvailableDomainsCategories,
          removeCategories: removeCategoriesAvailableDomainsCategories,
          setSort: setCategoriesAvailableDomainsSort,
          setSearch: setCategoriesAvailableDomainsSearch,
          setScrollTop: setCategoriesAvailableDomainsFiltersScrollTop,
          toggleFilterOpen: toggleCategoriesAvailableDomainsFilterOpen,
          clearFilters: clearCategoriesAvailableDomainsFilters,
        }
      }
      return {
        setFiltersOpen: setCategoriesPageFiltersOpen,
        setSearch: setCategoriesPageSearch,
        toggleFiltersType: toggleCategoriesPageType,
        setFiltersType: setCategoriesPageType,
        setSort: setCategoriesPageSort,
        setSortDirection: setCategoriesPageSortDirection,
        setScrollTop: setCategoriesPageScrollTop,
        toggleFilterOpen: toggleCategoriesPageFilterOpen,
        clearFilters: clearCategoriesPageFilters,
      } as any
    }

    if (filterType === 'category') {
      if (activeCategoryTab === 'names') {
        return {
          setFiltersOpen: setCategoryDomainsFiltersOpen,
          toggleFiltersStatus: toggleCategoryDomainsFiltersStatus,
          setFiltersStatus: setCategoryDomainsFiltersStatus,
          toggleFiltersType: toggleCategoryDomainsFiltersType,
          setFiltersType: setCategoryDomainsFiltersType,
          setMarketFilters: setCategoryDomainsMarketFilters,
          setTextMatchFilters: setCategoryDomainsTextMatchFilters,
          setTextNonMatchFilters: setCategoryDomainsTextNonMatchFilters,
          setFiltersLength: setCategoryDomainsFiltersLength,
          setPriceDenomination: setCategoryDomainsPriceDenomination,
          setPriceRange: setCategoryDomainsPriceRange,
          toggleCategory: toggleCategoryDomainsCategory,
          setFiltersCategory: setCategoryDomainsFiltersCategory,
          addCategories: addCategoryDomainsCategories,
          removeCategories: removeCategoryDomainsCategories,
          setSort: setCategoryDomainsSort,
          setSearch: setCategoryDomainsSearch,
          setScrollTop: setCategoryDomainsFiltersScrollTop,
          toggleFilterOpen: toggleCategoryDomainsFilterOpen,
          clearFilters: clearCategoryDomainsFilters,
        }
      } else if (activeCategoryTab === 'premium') {
        return {
          setFiltersOpen: setCategoryPremiumFiltersOpen,
          toggleFiltersType: toggleCategoryPremiumFiltersType,
          setFiltersType: setCategoryPremiumFiltersType,
          setMarketFilters: setCategoryPremiumMarketFilters,
          setTextMatchFilters: setCategoryPremiumTextMatchFilters,
          setTextNonMatchFilters: setCategoryPremiumTextNonMatchFilters,
          setFiltersLength: setCategoryPremiumFiltersLength,
          setPriceDenomination: setCategoryPremiumPriceDenomination,
          setPriceRange: setCategoryPremiumPriceRange,
          toggleCategory: toggleCategoryPremiumCategory,
          setFiltersCategory: setCategoryPremiumFiltersCategory,
          addCategories: addCategoryPremiumCategories,
          removeCategories: removeCategoryPremiumCategories,
          setSort: setCategoryPremiumSort,
          setSearch: setCategoryPremiumSearch,
          setScrollTop: setCategoryPremiumFiltersScrollTop,
          toggleFilterOpen: toggleCategoryPremiumFilterOpen,
          clearFilters: clearCategoryPremiumFilters,
        }
      } else if (activeCategoryTab === 'available') {
        return {
          setFiltersOpen: setCategoryAvailableFiltersOpen,
          toggleFiltersType: toggleCategoryAvailableFiltersType,
          setFiltersType: setCategoryAvailableFiltersType,
          setMarketFilters: setCategoryAvailableMarketFilters,
          setTextMatchFilters: setCategoryAvailableTextMatchFilters,
          setTextNonMatchFilters: setCategoryAvailableTextNonMatchFilters,
          setFiltersLength: setCategoryAvailableFiltersLength,
          setPriceDenomination: setCategoryAvailablePriceDenomination,
          setPriceRange: setCategoryAvailablePriceRange,
          toggleCategory: toggleCategoryAvailableCategory,
          setFiltersCategory: setCategoryAvailableFiltersCategory,
          addCategories: addCategoryAvailableCategories,
          removeCategories: removeCategoryAvailableCategories,
          setSort: setCategoryAvailableSort,
          setSearch: setCategoryAvailableSearch,
          setScrollTop: setCategoryAvailableFiltersScrollTop,
          toggleFilterOpen: toggleCategoryAvailableFilterOpen,
          clearFilters: clearCategoryAvailableFilters,
        }
      } else if (activeCategoryTab === 'activity') {
        return {
          setScrollTop: setCategoryActivityFiltersScrollTop,
          toggleFilterOpen: toggleCategoryActivityFilterOpen,
          toggleFiltersType: toggleCategoryActivityFiltersType,
          setFiltersOpen: setCategoryActivityFiltersOpen,
          setFiltersType: setCategoryActivityFiltersType,
          setSearch: setCategoryActivitySearch,
          clearFilters: clearCategoryActivityFilters,
        } as any
      }

      return {
        setFiltersOpen: setCategoryDomainsFiltersOpen,
        toggleFiltersStatus: toggleCategoryDomainsFiltersStatus,
        setFiltersStatus: setCategoryDomainsFiltersStatus,
        toggleFiltersType: toggleCategoryDomainsFiltersType,
        setFiltersType: setCategoryDomainsFiltersType,
        setMarketFilters: setCategoryDomainsMarketFilters,
        setTextMatchFilters: setCategoryDomainsTextMatchFilters,
        setTextNonMatchFilters: setCategoryDomainsTextNonMatchFilters,
        setFiltersLength: setCategoryDomainsFiltersLength,
        setPriceDenomination: setCategoryDomainsPriceDenomination,
        setPriceRange: setCategoryDomainsPriceRange,
        toggleCategory: toggleCategoryDomainsCategory,
        setFiltersCategory: setCategoryDomainsFiltersCategory,
        addCategories: addCategoryDomainsCategories,
        removeCategories: removeCategoryDomainsCategories,
        setSort: setCategoryDomainsSort,
        setSearch: setCategoryDomainsSearch,
        setScrollTop: setCategoryDomainsFiltersScrollTop,
        toggleFilterOpen: toggleCategoryDomainsFilterOpen,
        clearFilters: clearCategoryDomainsFilters,
      }
    }

    // if (filterType === 'profile') {
    //   if (profileTab === 'domains') {
    //     return {
    //       setFiltersOpen: setProfileDomainsFiltersOpen,
    //       toggleFiltersStatus: toggleProfileDomainsFiltersStatus,
    //       setFiltersStatus: setProfileDomainsFiltersStatus,
    //       toggleFiltersType: toggleProfileDomainsFiltersType,
    //       setFiltersType: setProfileDomainsFiltersType,
    //       setFiltersLength: setProfileDomainsFiltersLength,
    //       setPriceDenomination: setProfileDomainsPriceDenomination,
    //       setPriceRange: setProfileDomainsPriceRange,
    //       toggleCategory: toggleProfileDomainsCategory,
    //       setFiltersCategory: setProfileDomainsFiltersCategory,
    //       setSort: setProfileDomainsSort,
    //       setSearch: setProfileDomainsSearch,
    //       setScrollTop: setProfileDomainsFiltersScrollTop,
    //       toggleFilterOpen: toggleProfileDomainsFilterOpen,
    //       clearFilters: clearProfileDomainsFilters,
    //     }
    //   } else if (profileTab === 'activity') {
    //     return {
    //       setScrollTop: setProfileActivityFiltersScrollTop,
    //       toggleFilterOpen: toggleProfileActivityFilterOpen,
    //       toggleFiltersType: toggleActivityFiltersType,
    //       setFiltersOpen: setProfileActivityFilterOpen,
    //       setFiltersType: setActivityFiltersType,
    //       setSearch: setProfileActivitySearch,
    //       clearFilters: clearActivityFilters,
    //     } as any
    //   }

    //   return {
    //     setFiltersOpen: setProfileDomainsFiltersOpen,
    //     toggleFiltersStatus: toggleProfileDomainsFiltersStatus,
    //     setFiltersStatus: setProfileDomainsFiltersStatus,
    //     toggleFiltersType: toggleProfileDomainsFiltersType,
    //     setFiltersType: setProfileDomainsFiltersType,
    //     setFiltersLength: setProfileDomainsFiltersLength,
    //     setPriceDenomination: setProfileDomainsPriceDenomination,
    //     setPriceRange: setProfileDomainsPriceRange,
    //     toggleCategory: toggleProfileDomainsCategory,
    //     setFiltersCategory: setProfileDomainsFiltersCategory,
    //     setSort: setProfileDomainsSort,
    //     setSearch: setProfileDomainsSearch,
    //     setScrollTop: setProfileDomainsFiltersScrollTop,
    //     toggleFilterOpen: toggleProfileDomainsFilterOpen,
    //     clearFilters: clearProfileDomainsFilters,
    //   }
    // }

    if (filterType === 'profile') {
      if (activeProfileTab === 'domains') {
        return {
          setFiltersOpen: setProfileDomainsFiltersOpen,
          toggleFiltersStatus: toggleProfileDomainsFiltersStatus,
          setFiltersStatus: setProfileDomainsFiltersStatus,
          toggleFiltersType: toggleProfileDomainsFiltersType,
          setFiltersType: setProfileDomainsFiltersType,
          setMarketFilters: setProfileDomainsMarketFilters,
          setTextMatchFilters: setProfileDomainsTextMatchFilters,
          setTextNonMatchFilters: setProfileDomainsTextNonMatchFilters,
          setFiltersLength: setProfileDomainsFiltersLength,
          setPriceDenomination: setProfileDomainsPriceDenomination,
          setPriceRange: setProfileDomainsPriceRange,
          toggleCategory: toggleProfileDomainsCategory,
          setFiltersCategory: setProfileDomainsFiltersCategory,
          addCategories: addProfileDomainsCategories,
          removeCategories: removeProfileDomainsCategories,
          setSort: setProfileDomainsSort,
          setSearch: setProfileDomainsSearch,
          setScrollTop: setProfileDomainsFiltersScrollTop,
          toggleFilterOpen: toggleProfileDomainsFilterOpen,
          clearFilters: clearProfileDomainsFilters,
        }
      } else if (activeProfileTab === 'listings') {
        return {
          setFiltersOpen: setProfileListingsFiltersOpen,
          toggleFiltersType: toggleProfileListingsFiltersType,
          setFiltersType: setProfileListingsFiltersType,
          setMarketFilters: setProfileListingsMarketFilters,
          setTextMatchFilters: setProfileListingsTextMatchFilters,
          setTextNonMatchFilters: setProfileListingsTextNonMatchFilters,
          setFiltersLength: setProfileListingsFiltersLength,
          setPriceDenomination: setProfileListingsPriceDenomination,
          setPriceRange: setProfileListingsPriceRange,
          toggleCategory: toggleProfileListingsCategory,
          setFiltersCategory: setProfileListingsFiltersCategory,
          addCategories: addProfileListingsCategories,
          removeCategories: removeProfileListingsCategories,
          setSort: setProfileListingsSort,
          setSearch: setProfileListingsSearch,
          setScrollTop: setProfileListingsFiltersScrollTop,
          toggleFilterOpen: toggleProfileListingsFilterOpen,
          clearFilters: clearProfileListingsFilters,
        }
      } else if (activeProfileTab === 'grace') {
        return {
          setFiltersOpen: setProfileGraceFiltersOpen,
          toggleFiltersType: toggleProfileGraceFiltersType,
          setFiltersType: setProfileGraceFiltersType,
          setMarketFilters: setProfileGraceMarketFilters,
          setTextMatchFilters: setProfileGraceTextMatchFilters,
          setTextNonMatchFilters: setProfileGraceTextNonMatchFilters,
          setFiltersLength: setProfileGraceFiltersLength,
          setPriceDenomination: setProfileGracePriceDenomination,
          setPriceRange: setProfileGracePriceRange,
          toggleCategory: toggleProfileGraceCategory,
          setFiltersCategory: setProfileGraceFiltersCategory,
          addCategories: addProfileGraceCategories,
          removeCategories: removeProfileGraceCategories,
          setSort: setProfileGraceSort,
          setSearch: setProfileGraceSearch,
          setScrollTop: setProfileGraceFiltersScrollTop,
          toggleFilterOpen: toggleProfileGraceFilterOpen,
          clearFilters: clearProfileGraceFilters,
        }
      } else if (activeProfileTab === 'expired') {
        return {
          setFiltersOpen: setProfileExpiredFiltersOpen,
          toggleFiltersType: toggleProfileExpiredFiltersType,
          setFiltersType: setProfileExpiredFiltersType,
          setMarketFilters: setProfileExpiredMarketFilters,
          setTextMatchFilters: setProfileExpiredTextMatchFilters,
          setTextNonMatchFilters: setProfileExpiredTextNonMatchFilters,
          setFiltersLength: setProfileExpiredFiltersLength,
          setPriceDenomination: setProfileExpiredPriceDenomination,
          setPriceRange: setProfileExpiredPriceRange,
          toggleCategory: toggleProfileExpiredCategory,
          setFiltersCategory: setProfileExpiredFiltersCategory,
          addCategories: addProfileExpiredCategories,
          removeCategories: removeProfileExpiredCategories,
          setSort: setProfileExpiredSort,
          setSearch: setProfileExpiredSearch,
          setScrollTop: setProfileExpiredFiltersScrollTop,
          toggleFilterOpen: toggleProfileExpiredFilterOpen,
          clearFilters: clearProfileExpiredFilters,
        }
      } else if (activeProfileTab === 'sent_offers') {
        return {
          setFiltersOpen: setMyOffersFiltersOpen,
          toggleFiltersStatus: toggleMyOffersFiltersStatus,
          setFiltersStatus: setMyOffersFiltersStatus,
          toggleFiltersType: toggleMyOffersFiltersType,
          setFiltersType: setMyOffersFiltersType,
          setMarketFilters: setMyOffersMarketFilters,
          setTextMatchFilters: setMyOffersTextMatchFilters,
          setTextNonMatchFilters: setMyOffersTextNonMatchFilters,
          setFiltersLength: setMyOffersFiltersLength,
          setPriceDenomination: setMyOffersPriceDenomination,
          setPriceRange: setMyOffersPriceRange,
          toggleCategory: toggleMyOffersCategory,
          setFiltersCategory: setMyOffersFiltersCategory,
          addCategories: addMyOffersCategories,
          removeCategories: removeMyOffersCategories,
          setSort: setMyOffersSort,
          setSearch: setMyOffersSearch,
          setScrollTop: setMyOffersScrollTop,
          toggleFilterOpen: toggleMyOffersFilterOpen,
          clearFilters: clearMyOffersFilters,
        }
      } else if (activeProfileTab === 'received_offers') {
        return {
          setFiltersOpen: setReceivedOffersFiltersOpen,
          toggleFiltersStatus: toggleReceivedOffersFiltersStatus,
          setFiltersStatus: setReceivedOffersFiltersStatus,
          toggleFiltersType: toggleReceivedOffersFiltersType,
          setFiltersType: setReceivedOffersFiltersType,
          setMarketFilters: setReceivedOffersMarketFilters,
          setTextMatchFilters: setReceivedOffersTextMatchFilters,
          setTextNonMatchFilters: setReceivedOffersTextNonMatchFilters,
          setFiltersLength: setReceivedOffersFiltersLength,
          setPriceDenomination: setReceivedOffersPriceDenomination,
          setPriceRange: setReceivedOffersPriceRange,
          toggleCategory: toggleReceivedOffersCategory,
          setFiltersCategory: setReceivedOffersFiltersCategory,
          addCategories: addReceivedOffersCategories,
          removeCategories: removeReceivedOffersCategories,
          setSort: setReceivedOffersSort,
          setSearch: setReceivedOffersSearch,
          setScrollTop: setReceivedOffersScrollTop,
          toggleFilterOpen: toggleReceivedOffersFilterOpen,
          clearFilters: clearReceivedOffersFilters,
        }
      } else if (activeProfileTab === 'watchlist') {
        return {
          setFiltersOpen: setWatchlistFiltersOpen,
          toggleFiltersStatus: toggleWatchlistFiltersStatus,
          setFiltersStatus: setWatchlistFiltersStatus,
          toggleFiltersType: toggleWatchlistFiltersType,
          setFiltersType: setWatchlistFiltersType,
          setMarketFilters: setWatchlistMarketFilters,
          setTextMatchFilters: setWatchlistTextMatchFilters,
          setTextNonMatchFilters: setWatchlistTextNonMatchFilters,
          setFiltersLength: setWatchlistFiltersLength,
          setPriceDenomination: setWatchlistPriceDenomination,
          setPriceRange: setWatchlistPriceRange,
          toggleCategory: toggleWatchlistCategory,
          setFiltersCategory: setWatchlistFiltersCategory,
          addCategories: addWatchlistCategories,
          removeCategories: removeWatchlistCategories,
          setSort: setWatchlistSort,
          setSearch: setWatchlistSearch,
          setScrollTop: setWatchlistFiltersScrollTop,
          toggleFilterOpen: toggleWatchlistFilterOpen,
          clearFilters: clearWatchlistFilters,
        }
      } else if (activeProfileTab === 'activity') {
        return {
          setScrollTop: setProfileActivityFiltersScrollTop,
          toggleFilterOpen: toggleProfileActivityFilterOpen,
          toggleFiltersType: toggleActivityFiltersType,
          setFiltersOpen: setProfileActivityFilterOpen,
          setFiltersType: setActivityFiltersType,
          setSearch: setProfileActivitySearch,
          clearFilters: clearActivityFilters,
        } as any
      }

      return {
        setFiltersOpen: setProfileDomainsFiltersOpen,
        toggleFiltersStatus: toggleProfileDomainsFiltersStatus,
        setFiltersStatus: setProfileDomainsFiltersStatus,
        toggleFiltersType: toggleProfileDomainsFiltersType,
        setFiltersType: setProfileDomainsFiltersType,
        setMarketFilters: setProfileDomainsMarketFilters,
        setTextMatchFilters: setProfileDomainsTextMatchFilters,
        setTextNonMatchFilters: setProfileDomainsTextNonMatchFilters,
        setFiltersLength: setProfileDomainsFiltersLength,
        setPriceDenomination: setProfileDomainsPriceDenomination,
        setPriceRange: setProfileDomainsPriceRange,
        toggleCategory: toggleProfileDomainsCategory,
        setFiltersCategory: setProfileDomainsFiltersCategory,
        addCategories: addProfileDomainsCategories,
        removeCategories: removeProfileDomainsCategories,
        setSort: setProfileDomainsSort,
        setSearch: setProfileDomainsSearch,
        setScrollTop: setProfileDomainsFiltersScrollTop,
        toggleFilterOpen: toggleProfileDomainsFilterOpen,
        clearFilters: clearProfileDomainsFilters,
      }
    }

    if (filterType === 'marketplace') {
      if (activeMarketplaceTab === 'names') {
        return {
          setFiltersOpen: setMarketplaceFiltersOpen,
          toggleFiltersStatus: toggleMarketplaceFiltersStatus,
          setFiltersStatus: setMarketplaceFiltersStatus,
          toggleFiltersType: toggleMarketplaceFiltersType,
          setFiltersType: setMarketplaceFiltersType,
          setMarketFilters: setMarketplaceMarketFilters,
          setTextMatchFilters: setMarketplaceTextMatchFilters,
          setTextNonMatchFilters: setMarketplaceTextNonMatchFilters,
          setFiltersLength: setMarketplaceFiltersLength,
          setPriceDenomination: setMarketplacePriceDenomination,
          setPriceRange: setMarketplacePriceRange,
          toggleCategory: toggleMarketplaceCategory,
          setFiltersCategory: setMarketplaceFiltersCategory,
          addCategories: addMarketplaceCategories,
          removeCategories: removeMarketplaceCategories,
          setSort: setMarketplaceSort,
          setSearch: setMarketplaceSearch,
          setScrollTop: setMarketplaceScrollTop,
          toggleFilterOpen: toggleMarketplaceFilterOpen,
          clearFilters: clearMarketplaceFilters,
        }
      } else if (activeMarketplaceTab === 'premium') {
        return {
          setFiltersOpen: setMarketplacePremiumFiltersOpen,
          toggleFiltersType: toggleMarketplacePremiumFiltersType,
          setFiltersType: setMarketplacePremiumFiltersType,
          setMarketFilters: setMarketplacePremiumMarketFilters,
          setTextMatchFilters: setMarketplacePremiumTextMatchFilters,
          setTextNonMatchFilters: setMarketplacePremiumTextNonMatchFilters,
          setFiltersLength: setMarketplacePremiumFiltersLength,
          setPriceDenomination: setMarketplacePremiumPriceDenomination,
          setPriceRange: setMarketplacePremiumPriceRange,
          toggleCategory: toggleMarketplacePremiumCategory,
          setFiltersCategory: setMarketplacePremiumFiltersCategory,
          addCategories: addMarketplacePremiumCategories,
          removeCategories: removeMarketplacePremiumCategories,
          setSort: setMarketplacePremiumSort,
          setSearch: setMarketplacePremiumSearch,
          setScrollTop: setMarketplacePremiumFiltersScrollTop,
          toggleFilterOpen: toggleMarketplacePremiumFilterOpen,
          clearFilters: clearMarketplacePremiumFilters,
        }
      } else if (activeMarketplaceTab === 'available') {
        return {
          setFiltersOpen: setMarketplaceAvailableFiltersOpen,
          toggleFiltersType: toggleMarketplaceAvailableFiltersType,
          setFiltersType: setMarketplaceAvailableFiltersType,
          setMarketFilters: setMarketplaceAvailableMarketFilters,
          setTextMatchFilters: setMarketplaceAvailableTextMatchFilters,
          setTextNonMatchFilters: setMarketplaceAvailableTextNonMatchFilters,
          setFiltersLength: setMarketplaceAvailableFiltersLength,
          setPriceDenomination: setMarketplaceAvailablePriceDenomination,
          setPriceRange: setMarketplaceAvailablePriceRange,
          toggleCategory: toggleMarketplaceAvailableCategory,
          setFiltersCategory: setMarketplaceAvailableFiltersCategory,
          addCategories: addMarketplaceAvailableCategories,
          removeCategories: removeMarketplaceAvailableCategories,
          setSort: setMarketplaceAvailableSort,
          setSearch: setMarketplaceAvailableSearch,
          setScrollTop: setMarketplaceAvailableFiltersScrollTop,
          toggleFilterOpen: toggleMarketplaceAvailableFilterOpen,
          clearFilters: clearMarketplaceAvailableFilters,
        }
      } else if (activeMarketplaceTab === 'activity') {
        return {
          setScrollTop: setMarketplaceActivityFiltersScrollTop,
          toggleFilterOpen: toggleMarketplaceActivityFilterOpen,
          toggleFiltersType: toggleMarketplaceActivityFiltersType,
          setFiltersOpen: setMarketplaceActivityFiltersOpen,
          setFiltersType: setMarketplaceActivityFiltersType,
          setSearch: setMarketplaceActivitySearch,
          clearFilters: clearMarketplaceActivityFilters,
        } as any
      }

      return {
        setFiltersOpen: setMarketplaceFiltersOpen,
        toggleFiltersStatus: toggleMarketplaceFiltersStatus,
        setFiltersStatus: setMarketplaceFiltersStatus,
        toggleFiltersType: toggleMarketplaceFiltersType,
        setFiltersType: setMarketplaceFiltersType,
        setMarketFilters: setMarketplaceMarketFilters,
        setTextMatchFilters: setMarketplaceTextMatchFilters,
        setTextNonMatchFilters: setMarketplaceTextNonMatchFilters,
        setFiltersLength: setMarketplaceFiltersLength,
        setPriceDenomination: setMarketplacePriceDenomination,
        setPriceRange: setMarketplacePriceRange,
        toggleCategory: toggleMarketplaceCategory,
        setFiltersCategory: setMarketplaceFiltersCategory,
        addCategories: addMarketplaceCategories,
        removeCategories: removeMarketplaceCategories,
        setSort: setMarketplaceSort,
        setSearch: setMarketplaceSearch,
        setScrollTop: setMarketplaceScrollTop,
        toggleFilterOpen: toggleMarketplaceFilterOpen,
        clearFilters: clearMarketplaceFilters,
      }
    }

    return {
      setFiltersOpen: setMarketplaceFiltersOpen,
      toggleFiltersStatus: toggleMarketplaceFiltersStatus,
      setFiltersStatus: setMarketplaceFiltersStatus,
      toggleFiltersType: toggleMarketplaceFiltersType,
      setFiltersType: setMarketplaceFiltersType,
      setMarketFilters: setMarketplaceMarketFilters,
      setTextMatchFilters: setMarketplaceTextMatchFilters,
      setTextNonMatchFilters: setMarketplaceTextNonMatchFilters,
      setFiltersLength: setMarketplaceFiltersLength,
      setPriceDenomination: setMarketplacePriceDenomination,
      setPriceRange: setMarketplacePriceRange,
      toggleCategory: toggleMarketplaceCategory,
      setFiltersCategory: setMarketplaceFiltersCategory,
      addCategories: addMarketplaceCategories,
      removeCategories: removeMarketplaceCategories,
      setSort: setMarketplaceSort,
      setSearch: setMarketplaceSearch,
      setScrollTop: setMarketplaceScrollTop,
      toggleFilterOpen: toggleMarketplaceFilterOpen,
      clearFilters: clearMarketplaceFilters,
    }
  }, [filterType, activeProfileTab, activeMarketplaceTab, activeCategoryTab, activeCategoriesPageTab])

  const emptyFilterState = useMemo(() => {
    if (filterType === 'categoriesPage') {
      if (activeCategoriesPageTab === 'categories') {
        return emptyFilterStateCategoriesPageFilters
      } else if (activeCategoriesPageTab === 'names') {
        return emptyFilterStateCategoriesNamesFilters
      } else if (activeCategoriesPageTab === 'premium') {
        return emptyFilterStateCategoriesPremiumDomainsFilters
      } else if (activeCategoriesPageTab === 'available') {
        return emptyFilterStateCategoriesAvailableDomainsFilters
      }
      return emptyFilterStateCategoriesPageFilters
    }

    if (filterType === 'category') {
      if (activeCategoryTab === 'names') {
        return emptyFilterStateCategoryDomainsFilters
      } else if (activeCategoryTab === 'premium') {
        return emptyFilterStateCategoryPremiumFilters
      } else if (activeCategoryTab === 'available') {
        return emptyFilterStateCategoryAvailableFilters
      } else if (activeCategoryTab === 'activity') {
        return emptyFilterStateCategoryActivityFilters
      }
      return emptyFilterStateCategoryDomainsFilters
    }

    if (filterType === 'marketplace') {
      if (activeMarketplaceTab === 'names') {
        return emptyFilterStateMarketplaceFilters
      } else if (activeMarketplaceTab === 'premium') {
        return emptyFilterStateMarketplacePremiumFilters
      } else if (activeMarketplaceTab === 'available') {
        return emptyFilterStateMarketplaceAvailableFilters
      } else if (activeMarketplaceTab === 'activity') {
        return emptyFilterStateMarketplaceActivityFilters
      }
      return emptyFilterStateMarketplaceFilters
    }

    if (filterType === 'profile') {
      if (activeProfileTab === 'domains') {
        return emptyFilterStateProfileDomainsFilters
      } else if (activeProfileTab === 'listings') {
        return emptyFilterStateProfileListingsFilters
      } else if (activeProfileTab === 'grace') {
        return emptyFilterStateProfileGraceFilters
      } else if (activeProfileTab === 'sent_offers') {
        return emptyFilterStateMyOffersFilters
      } else if (activeProfileTab === 'received_offers') {
        return emptyFilterStateReceivedOffersFilters
      } else if (activeProfileTab === 'watchlist') {
        return emptyFilterStateWatchlistFilters
      } else if (activeProfileTab === 'activity') {
        return emptyFilterStateProfileActivityFilters
      }

      return emptyFilterStateProfileDomainsFilters
    }

    return emptyFilterStateMarketplaceFilters
  }, [filterType, activeProfileTab, activeMarketplaceTab, activeCategoryTab, activeCategoriesPageTab])

  const isFiltersClear = useMemo(() => {
    const filtersWithoutOpenFilters = _.omit(filters, 'openFilters')
    const filtersWithoutOpen = _.omit(filtersWithoutOpenFilters, 'open')
    const filtersWithoutScrollTop = _.omit(filtersWithoutOpen, 'scrollTop')
    return _.isEqual(filtersWithoutScrollTop, emptyFilterState)
  }, [filters, emptyFilterState])

  return {
    selectors: {
      // Override the open state with the shared filter panel state
      filters: {
        ...filters,
        open: filterPanelState.open,
      },
    } as any,
    actions: {
      ...actions,
      // Override setFiltersOpen to use the shared filter panel action
      setFiltersOpen: setFilterPanelOpen,
    } as any,
    context: filterType,
    profileTab: profileState.selectedTab,
    marketplaceTab: marketplaceState.selectedTab,
    categoryTab: categoryState.selectedTab,
    categoriesPageTab: categoriesPageState.categoriesPage.selectedTab,
    isFiltersClear,
  }
}
