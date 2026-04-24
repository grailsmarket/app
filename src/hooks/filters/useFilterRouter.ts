import _ from 'lodash'
import { RootState } from '@/state'
import { useAppSelector } from '@/state/hooks'
import { useFilterContext } from '@/context/filters'
import { FilterRouter } from '@/types/filters/name'
import { selectFilterPanel, setFilterPanelOpen } from '@/state/reducers/filterPanel'
import { selectUserProfile } from '@/state/reducers/portfolio/profile'
import { useMemo } from 'react'
import { selectCategory } from '@/state/reducers/category/category'
import { selectCategoriesPage } from '@/state/reducers/categoriesPage/categoriesPage'

import {
  emptyFilterState as emptyFilterStateMarketplaceFilters,
  selectMarketplaceFilters,
  MarketplaceFilterActions,
} from '@/state/reducers/filters/marketplaceFilters'

import {
  emptyFilterState as emptyFilterStateMarketplaceListingsFilters,
  selectMarketplaceListingsFilters,
  MarketplaceListingsFilterActions,
} from '@/state/reducers/filters/marketplaceListingsFilters'

import {
  emptyFilterState as emptyFilterStateMarketplaceActivityFilters,
  selectMarketplaceActivityFilters,
  marketplaceActivityFiltersActions,
} from '@/state/reducers/filters/marketplaceActivityFilters'

import {
  emptyFilterState as emptyFilterStateMarketplacePremiumFilters,
  selectMarketplacePremiumFilters,
  MarketplacePremiumFilterActions,
} from '@/state/reducers/filters/marketplacePremiumFilters'

import {
  emptyFilterState as emptyFilterStateMarketplaceAvailableFilters,
  selectMarketplaceAvailableFilters,
  MarketplaceAvailableFilterActions,
} from '@/state/reducers/filters/marketplaceAvailableFilters'

import { selectMarketplace } from '@/state/reducers/marketplace/marketplace'

import {
  emptyFilterState as emptyFilterStateMyOffersFilters,
  selectMyOffersFilters,
  MyOffersFilterActions,
} from '@/state/reducers/filters/myOffersFilters'

import {
  emptyFilterState as emptyFilterStateReceivedOffersFilters,
  selectReceivedOffersFilters,
  receivedOffersFiltersActions,
} from '@/state/reducers/filters/receivedOffersFilters'

import {
  emptyFilterState as emptyFilterStateWatchlistFilters,
  selectWatchlistFilters,
  WatchlistFilterActions,
} from '@/state/reducers/filters/watchlistFilters'

import {
  emptyFilterState as emptyFilterStateProfileDomainsFilters,
  selectProfileDomainsFilters,
  ProfileDomainsFilterActions,
} from '@/state/reducers/filters/profileDomainsFilters'

import {
  emptyFilterState as emptyFilterStateProfileListingsFilters,
  selectProfileListingsFilters,
  ProfileListingsFilterActions,
} from '@/state/reducers/filters/profileListingsFilter'

import {
  emptyFilterState as emptyFilterStateProfileActivityFilters,
  selectProfileActivityFilters,
  profileActivityFiltersActions,
} from '@/state/reducers/filters/profileActivityFilters'

import {
  emptyFilterState as emptyFilterStateProfileGraceFilters,
  selectProfileGraceFilters,
  ProfileGraceFilterActions,
} from '@/state/reducers/filters/profileGraceFilters'

import {
  emptyFilterState as emptyFilterStateProfileExpiredFilters,
  selectProfileExpiredFilters,
  ProfileExpiredFilterActions,
} from '@/state/reducers/filters/profileExpiredFilters'

import {
  emptyFilterState as emptyFilterStateCategoryDomainsFilters,
  selectCategoryDomainsFilters,
  CategoryDomainsFilterActions,
} from '@/state/reducers/filters/categoryDomainsFilters'

import {
  emptyFilterState as emptyFilterStateCategoryListingsFilters,
  selectCategoryListingsFilters,
  CategoryListingsFilterActions,
} from '@/state/reducers/filters/categoryListingsFilters'

import {
  emptyFilterState as emptyFilterStateCategoryPremiumFilters,
  selectCategoryPremiumFilters,
  CategoryPremiumFilterActions,
} from '@/state/reducers/filters/categoryPremiumFilters'

import {
  emptyFilterState as emptyFilterStateCategoryAvailableFilters,
  selectCategoryAvailableFilters,
  CategoryAvailableFilterActions,
} from '@/state/reducers/filters/categoryAvailableFilters'

import {
  emptyFilterState as emptyFilterStateCategoryActivityFilters,
  selectCategoryActivityFilters,
  categoryActivityFiltersActions,
} from '@/state/reducers/filters/categoryActivityFilters'

// Import category state selector
import { selectCategory } from '@/state/reducers/category/category'

// Import categoriesPage state selector
import { selectCategoriesPage } from '@/state/reducers/categoriesPage/categoriesPage'

// Import bulkSearch state selector and filter actions
import { selectBulkSearch } from '@/state/reducers/bulkSearch/bulkSearch'
import {
  emptyFilterState as emptyFilterStateBulkSearchFilters,
  selectBulkSearchFilters,
  setBulkSearchFiltersOpen,
  toggleBulkSearchFiltersStatus,
  setBulkSearchFiltersStatus,
  toggleBulkSearchFiltersType,
  setBulkSearchFiltersType,
  setBulkSearchMarketFilters,
  setBulkSearchTextMatchFilters,
  setBulkSearchTextNonMatchFilters,
  setBulkSearchFiltersLength,
  setBulkSearchPriceDenomination,
  setBulkSearchPriceRange,
  setBulkSearchOfferRange,
  setBulkSearchWatchersCount,
  setBulkSearchViewCount,
  setBulkSearchClubsCount,
  setBulkSearchCreationDate,
  toggleBulkSearchCategory,
  setBulkSearchFiltersCategory,
  addBulkSearchCategories,
  removeBulkSearchCategories,
  setBulkSearchSort,
  setBulkSearchSearch,
  setBulkSearchFiltersScrollTop,
  toggleBulkSearchFilterOpen,
  clearBulkSearchFilters,
} from '@/state/reducers/filters/bulkSearchFilters'

// Import categoriesNamesFilters selectors and actions
import {
  emptyFilterState as emptyFilterStateCategoriesNamesFilters,
  selectCategoriesNamesFilters,
  CategoriesNamesFilterActions,
} from '@/state/reducers/filters/categoriesNamesFilters'

import {
  emptyFilterState as emptyFilterStateCategoriesListingsFilters,
  selectCategoriesListingsFilters,
  CategoriesListingsFilterActions,
} from '@/state/reducers/filters/categoriesListingsFilters'

import {
  emptyFilterState as emptyFilterStateCategoriesPremiumDomainsFilters,
  selectCategoriesPremiumDomainsFilters,
  CategoriesPremiumDomainsFilterActions,
} from '@/state/reducers/filters/categoriesPremiumDomainsFilters'

import {
  emptyFilterState as emptyFilterStateCategoriesAvailableDomainsFilters,
  selectCategoriesAvailableDomainsFilters,
  CategoriesAvailableDomainsFilterActions,
} from '@/state/reducers/filters/categoriesAvailableDomainsFilters'

import {
  emptyFilterState as emptyFilterStateCategoriesPageFilters,
  selectCategoriesPageFilters,
  categoriesPageFiltersActions,
} from '@/state/reducers/filters/categoriesPageFilters'

import {
  emptyFilterState as emptyFilterStateCategoriesActivityFilters,
  selectCategoriesActivityFilters,
  categoriesActivityFiltersActions,
} from '@/state/reducers/filters/categoriesActivityFilters'

export function useFilterRouter(): FilterRouter {
  const { filterType } = useFilterContext()
  const profileState = useAppSelector(selectUserProfile)
  const marketplaceState = useAppSelector(selectMarketplace)
  const categoryState = useAppSelector(selectCategory)
  const categoriesPageState = useAppSelector(selectCategoriesPage)
  const bulkSearchState = useAppSelector(selectBulkSearch)
  const filterPanelState = useAppSelector(selectFilterPanel)

  // Determine which tab is active for each page
  const activeProfileTab = profileState.selectedTab?.value || 'domains'
  const activeMarketplaceTab = marketplaceState.selectedTab?.value || 'names'
  const activeCategoryTab = categoryState.selectedTab?.value || 'names'
  const activeCategoriesPageTab = categoriesPageState.categoriesPage.selectedTab?.value || 'categories'
  // Determine which tab is active in bulkSearch
  const activeBulkSearchTab = bulkSearchState.selectedTab?.value || 'names'

  const activeTab = useMemo(() => {
    switch (filterType) {
      case 'categoriesPage':
        return activeCategoriesPageTab
      case 'category':
        return activeCategoryTab
      case 'marketplace':
        return activeMarketplaceTab
      default:
        return 'names'
    }
  }, [filterType, activeBulkSearchTab, activeCategoriesPageTab, activeCategoryTab, activeMarketplaceTab])

  // Select appropriate filters depending on context
  const filters = useAppSelector((state: RootState) => {
    if (filterType === 'bulkSearch') {
      return selectBulkSearchFilters(state)
    }

    if (filterType === 'categoriesPage') {
      switch (activeCategoriesPageTab) {
        case 'categories':
          return selectCategoriesPageFilters(state)
        case 'names':
          return selectCategoriesNamesFilters(state)
        case 'listings':
          return selectCategoriesListingsFilters(state)
        case 'premium':
          return selectCategoriesPremiumDomainsFilters(state)
        case 'available':
          return selectCategoriesAvailableDomainsFilters(state)
        case 'activity':
          return selectCategoriesActivityFilters(state)
        default:
          return selectCategoriesPageFilters(state)
      }
    }

    if (filterType === 'category') {
      switch (activeCategoryTab) {
        case 'names':
          return selectCategoryDomainsFilters(state)
        case 'listings':
          return selectCategoryListingsFilters(state)
        case 'premium':
          return selectCategoryPremiumFilters(state)
        case 'available':
          return selectCategoryAvailableFilters(state)
        case 'activity':
          return selectCategoryActivityFilters(state)
        default:
          return selectCategoryDomainsFilters(state)
      }
    }

    if (filterType === 'marketplace') {
      switch (activeMarketplaceTab) {
        case 'names':
          return selectMarketplaceFilters(state)
        case 'listings':
          return selectMarketplaceListingsFilters(state)
        case 'premium':
          return selectMarketplacePremiumFilters(state)
        case 'available':
          return selectMarketplaceAvailableFilters(state)
        case 'activity':
          return selectMarketplaceActivityFilters(state)
        default:
          return selectMarketplaceFilters(state)
      }
    }

    if (filterType === 'profile') {
      switch (activeProfileTab) {
        case 'domains':
          return selectProfileDomainsFilters(state)
        case 'listings':
          return selectProfileListingsFilters(state)
        case 'grace':
          return selectProfileGraceFilters(state)
        case 'expired':
          return selectProfileExpiredFilters(state)
        case 'sent_offers':
          return selectMyOffersFilters(state)
        case 'received_offers':
          return selectReceivedOffersFilters(state)
        case 'watchlist':
          return selectWatchlistFilters(state)
        case 'activity':
          return selectProfileActivityFilters(state)
        default:
          return selectProfileDomainsFilters(state)
      }
    }

    return selectMarketplaceFilters(state)
  })

  // Return the appropriate actions based on context
  const actions = useMemo(() => {
    if (filterType === 'categoriesPage') {
      switch (activeCategoriesPageTab) {
        case 'categories':
          return categoriesPageFiltersActions
        case 'names':
          return CategoriesNamesFilterActions
        case 'listings':
          return CategoriesListingsFilterActions
        case 'premium':
          return CategoriesPremiumDomainsFilterActions
        case 'available':
          return CategoriesAvailableDomainsFilterActions
        case 'activity':
          return categoriesActivityFiltersActions
        default:
          return categoriesPageFiltersActions
      }
    }

    if (filterType === 'category') {
      switch (activeCategoryTab) {
        case 'names':
          return CategoryDomainsFilterActions
        case 'listings':
          return CategoryListingsFilterActions
        case 'premium':
          return CategoryPremiumFilterActions
        case 'available':
          return CategoryAvailableFilterActions
        case 'activity':
          return categoryActivityFiltersActions
        default:
          return CategoryDomainsFilterActions
      }
    }

    if (filterType === 'profile') {
      switch (activeProfileTab) {
        case 'domains':
          return ProfileDomainsFilterActions
        case 'listings':
          return ProfileListingsFilterActions
        case 'grace':
          return ProfileGraceFilterActions
        case 'expired':
          return ProfileExpiredFilterActions
        case 'sent_offers':
          return MyOffersFilterActions
        case 'received_offers':
          return receivedOffersFiltersActions
        case 'watchlist':
          return WatchlistFilterActions
        case 'activity':
          return profileActivityFiltersActions
        default:
          return ProfileDomainsFilterActions
      }
    }

    if (filterType === 'marketplace') {
      switch (activeMarketplaceTab) {
        case 'names':
          return MarketplaceFilterActions
        case 'listings':
          return MarketplaceListingsFilterActions
        case 'premium':
          return MarketplacePremiumFilterActions
        case 'available':
          return MarketplaceAvailableFilterActions
        case 'activity':
          return marketplaceActivityFiltersActions
        default:
          return MarketplaceFilterActions
      }
    }

    return MarketplaceFilterActions
  }, [
    filterType,
    activeProfileTab,
    activeMarketplaceTab,
    activeCategoryTab,
    activeCategoriesPageTab,
    activeBulkSearchTab,
  ])

  const emptyFilterState = useMemo(() => {
    if (filterType === 'bulkSearch') {
      return emptyFilterStateBulkSearchFilters
    }

    if (filterType === 'categoriesPage') {
      switch (activeCategoriesPageTab) {
        case 'categories':
          return emptyFilterStateCategoriesPageFilters
        case 'names':
          return emptyFilterStateCategoriesNamesFilters
        case 'listings':
          return emptyFilterStateCategoriesListingsFilters
        case 'premium':
          return emptyFilterStateCategoriesPremiumDomainsFilters
        case 'available':
          return emptyFilterStateCategoriesAvailableDomainsFilters
        case 'activity':
          return emptyFilterStateCategoriesActivityFilters
        default:
          return emptyFilterStateCategoriesPageFilters
      }
    }

    if (filterType === 'category') {
      switch (activeCategoryTab) {
        case 'names':
          return emptyFilterStateCategoryDomainsFilters
        case 'listings':
          return emptyFilterStateCategoryListingsFilters
        case 'premium':
          return emptyFilterStateCategoryPremiumFilters
        case 'available':
          return emptyFilterStateCategoryAvailableFilters
        case 'activity':
          return emptyFilterStateCategoryActivityFilters
        default:
          return emptyFilterStateCategoryDomainsFilters
      }
    }

    if (filterType === 'marketplace') {
      switch (activeMarketplaceTab) {
        case 'names':
          return emptyFilterStateMarketplaceFilters
        case 'listings':
          return emptyFilterStateMarketplaceListingsFilters
        case 'premium':
          return emptyFilterStateMarketplacePremiumFilters
        case 'available':
          return emptyFilterStateMarketplaceAvailableFilters
        case 'activity':
          return emptyFilterStateMarketplaceActivityFilters
        default:
          return emptyFilterStateMarketplaceFilters
      }
    }

    if (filterType === 'profile') {
      switch (activeProfileTab) {
        case 'domains':
          return emptyFilterStateProfileDomainsFilters
        case 'listings':
          return emptyFilterStateProfileListingsFilters
        case 'grace':
          return emptyFilterStateProfileGraceFilters
        case 'expired':
          return emptyFilterStateProfileExpiredFilters
        case 'sent_offers':
          return emptyFilterStateMyOffersFilters
        case 'received_offers':
          return emptyFilterStateReceivedOffersFilters
        case 'watchlist':
          return emptyFilterStateWatchlistFilters
        case 'activity':
          return emptyFilterStateProfileActivityFilters
        default:
          return emptyFilterStateProfileDomainsFilters
      }
    }

    return emptyFilterStateMarketplaceFilters
  }, [
    filterType,
    activeProfileTab,
    activeMarketplaceTab,
    activeCategoryTab,
    activeCategoriesPageTab,
    activeBulkSearchTab,
  ])

  const isFiltersClear = useMemo(() => {
    const filtersWithoutOpen = _.omit(filters, 'open')
    const filtersWithoutScrollTop = _.omit(filtersWithoutOpen, 'scrollTop')
    // console.log(filtersWithoutScrollTop, emptyFilterState)
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
    bulkSearchTab: bulkSearchState.selectedTab,
    activeTab,
    isFiltersClear,
  }
}
