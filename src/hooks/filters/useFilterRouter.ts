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
  setMarketplaceFiltersLength,
  setMarketplacePriceDenomination,
  setMarketplacePriceRange,
  toggleMarketplaceCategory,
  setMarketplaceFiltersCategory,
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
  setMyOffersFiltersLength,
  setMyOffersPriceDenomination,
  setMyOffersPriceRange,
  toggleMyOffersCategory,
  setMyOffersFiltersCategory,
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
  setReceivedOffersFiltersLength,
  setReceivedOffersPriceDenomination,
  setReceivedOffersPriceRange,
  toggleReceivedOffersCategory,
  setReceivedOffersFiltersCategory,
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
  setWatchlistFiltersLength,
  setWatchlistPriceDenomination,
  setWatchlistPriceRange,
  toggleWatchlistCategory,
  setWatchlistFiltersCategory,
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
  setFiltersLength as setProfileDomainsFiltersLength,
  setPriceDenomination as setProfileDomainsPriceDenomination,
  setPriceRange as setProfileDomainsPriceRange,
  toggleCategory as toggleProfileDomainsCategory,
  setFiltersCategory as setProfileDomainsFiltersCategory,
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
  setFiltersLength as setProfileListingsFiltersLength,
  setPriceDenomination as setProfileListingsPriceDenomination,
  setPriceRange as setProfileListingsPriceRange,
  toggleCategory as toggleProfileListingsCategory,
  setFiltersCategory as setProfileListingsFiltersCategory,
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

// Import categoryDomains selectors and actions
import {
  emptyFilterState as emptyFilterStateCategoryDomainsFilters,
  selectCategoryDomainsFilters,
  setFiltersOpen as setCategoryDomainsFiltersOpen,
  toggleFiltersStatus as toggleCategoryDomainsFiltersStatus,
  setFiltersStatus as setCategoryDomainsFiltersStatus,
  toggleFiltersType as toggleCategoryDomainsFiltersType,
  setFiltersType as setCategoryDomainsFiltersType,
  setFiltersLength as setCategoryDomainsFiltersLength,
  setPriceDenomination as setCategoryDomainsPriceDenomination,
  setPriceRange as setCategoryDomainsPriceRange,
  toggleCategory as toggleCategoryDomainsCategory,
  setFiltersCategory as setCategoryDomainsFiltersCategory,
  setSort as setCategoryDomainsSort,
  setSearch as setCategoryDomainsSearch,
  setFiltersScrollTop as setCategoryDomainsFiltersScrollTop,
  toggleFilterOpen as toggleCategoryDomainsFilterOpen,
  clearFilters as clearCategoryDomainsFilters,
} from '@/state/reducers/filters/categoryDomainsFilters'

export function useFilterRouter(): FilterRouter<FilterContextType> {
  const { filterType } = useFilterContext()
  const profileState = useAppSelector(selectUserProfile)
  const marketplaceState = useAppSelector(selectMarketplace)
  const filterPanelState = useAppSelector(selectFilterPanel)

  // Determine which tab is active in profile
  const activeProfileTab = profileState.selectedTab?.value || 'domains'
  // Determine which tab is active in marketplace
  const activeMarketplaceTab = marketplaceState.selectedTab?.value || 'names'

  // Select appropriate filters depending on context
  const filters = useAppSelector((state: RootState) => {
    if (filterType === 'category') {
      return selectCategoryDomainsFilters(state)
    }

    if (filterType === 'marketplace') {
      if (activeMarketplaceTab === 'activity') {
        return selectMarketplaceActivityFilters(state)
      }

      return selectMarketplaceFilters(state)
    }

    if (filterType === 'profile') {
      if (activeProfileTab === 'domains') {
        return selectProfileDomainsFilters(state)
      } else if (activeProfileTab === 'listings') {
        return selectProfileListingsFilters(state)
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
    if (filterType === 'category') {
      return {
        setFiltersOpen: setCategoryDomainsFiltersOpen,
        toggleFiltersStatus: toggleCategoryDomainsFiltersStatus,
        setFiltersStatus: setCategoryDomainsFiltersStatus,
        toggleFiltersType: toggleCategoryDomainsFiltersType,
        setFiltersType: setCategoryDomainsFiltersType,
        setFiltersLength: setCategoryDomainsFiltersLength,
        setPriceDenomination: setCategoryDomainsPriceDenomination,
        setPriceRange: setCategoryDomainsPriceRange,
        toggleCategory: toggleCategoryDomainsCategory,
        setFiltersCategory: setCategoryDomainsFiltersCategory,
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
          setFiltersLength: setProfileDomainsFiltersLength,
          setPriceDenomination: setProfileDomainsPriceDenomination,
          setPriceRange: setProfileDomainsPriceRange,
          toggleCategory: toggleProfileDomainsCategory,
          setFiltersCategory: setProfileDomainsFiltersCategory,
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
          setFiltersLength: setProfileListingsFiltersLength,
          setPriceDenomination: setProfileListingsPriceDenomination,
          setPriceRange: setProfileListingsPriceRange,
          toggleCategory: toggleProfileListingsCategory,
          setFiltersCategory: setProfileListingsFiltersCategory,
          setSort: setProfileListingsSort,
          setSearch: setProfileListingsSearch,
          setScrollTop: setProfileListingsFiltersScrollTop,
          toggleFilterOpen: toggleProfileListingsFilterOpen,
          clearFilters: clearProfileListingsFilters,
        }
      } else if (activeProfileTab === 'sent_offers') {
        return {
          setFiltersOpen: setMyOffersFiltersOpen,
          toggleFiltersStatus: toggleMyOffersFiltersStatus,
          setFiltersStatus: setMyOffersFiltersStatus,
          toggleFiltersType: toggleMyOffersFiltersType,
          setFiltersType: setMyOffersFiltersType,
          setFiltersLength: setMyOffersFiltersLength,
          setPriceDenomination: setMyOffersPriceDenomination,
          setPriceRange: setMyOffersPriceRange,
          toggleCategory: toggleMyOffersCategory,
          setFiltersCategory: setMyOffersFiltersCategory,
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
          setFiltersLength: setReceivedOffersFiltersLength,
          setPriceDenomination: setReceivedOffersPriceDenomination,
          setPriceRange: setReceivedOffersPriceRange,
          toggleCategory: toggleReceivedOffersCategory,
          setFiltersCategory: setReceivedOffersFiltersCategory,
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
          setFiltersLength: setWatchlistFiltersLength,
          setPriceDenomination: setWatchlistPriceDenomination,
          setPriceRange: setWatchlistPriceRange,
          toggleCategory: toggleWatchlistCategory,
          setFiltersCategory: setWatchlistFiltersCategory,
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
        setFiltersLength: setProfileDomainsFiltersLength,
        setPriceDenomination: setProfileDomainsPriceDenomination,
        setPriceRange: setProfileDomainsPriceRange,
        toggleCategory: toggleProfileDomainsCategory,
        setFiltersCategory: setProfileDomainsFiltersCategory,
        setSort: setProfileDomainsSort,
        setSearch: setProfileDomainsSearch,
        setScrollTop: setProfileDomainsFiltersScrollTop,
        toggleFilterOpen: toggleProfileDomainsFilterOpen,
        clearFilters: clearProfileDomainsFilters,
      }
    }

    if (filterType === 'marketplace') {
      if (activeMarketplaceTab === 'activity') {
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
        setFiltersLength: setMarketplaceFiltersLength,
        setPriceDenomination: setMarketplacePriceDenomination,
        setPriceRange: setMarketplacePriceRange,
        toggleCategory: toggleMarketplaceCategory,
        setFiltersCategory: setMarketplaceFiltersCategory,
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
      setFiltersLength: setMarketplaceFiltersLength,
      setPriceDenomination: setMarketplacePriceDenomination,
      setPriceRange: setMarketplacePriceRange,
      toggleCategory: toggleMarketplaceCategory,
      setFiltersCategory: setMarketplaceFiltersCategory,
      setSort: setMarketplaceSort,
      setSearch: setMarketplaceSearch,
      setScrollTop: setMarketplaceScrollTop,
      toggleFilterOpen: toggleMarketplaceFilterOpen,
      clearFilters: clearMarketplaceFilters,
    }
  }, [filterType, activeProfileTab, activeMarketplaceTab])

  const emptyFilterState = useMemo(() => {
    if (filterType === 'category') {
      return emptyFilterStateCategoryDomainsFilters
    }

    if (filterType === 'marketplace') {
      if (activeMarketplaceTab === 'activity') {
        return emptyFilterStateMarketplaceActivityFilters
      }
      return emptyFilterStateMarketplaceFilters
    }

    if (filterType === 'profile') {
      if (activeProfileTab === 'domains') {
        return emptyFilterStateProfileDomainsFilters
      } else if (activeProfileTab === 'listings') {
        return emptyFilterStateProfileListingsFilters
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
  }, [filterType, activeProfileTab, activeMarketplaceTab])

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
    },
    actions: {
      ...actions,
      // Override setFiltersOpen to use the shared filter panel action
      setFiltersOpen: setFilterPanelOpen,
    } as any,
    context: filterType,
    profileTab: profileState.selectedTab,
    marketplaceTab: marketplaceState.selectedTab,
    isFiltersClear,
  }
}
