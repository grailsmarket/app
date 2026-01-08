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
  setMyOffersMarketFilters,
  setMyOffersTextMatchFilters,
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
  setReceivedOffersMarketFilters,
  setReceivedOffersTextMatchFilters,
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
  setWatchlistMarketFilters,
  setWatchlistTextMatchFilters,
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
  setMarketFilters as setProfileDomainsMarketFilters,
  setProfileDomainsTextMatchFilters,
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
  setMarketFilters as setProfileListingsMarketFilters,
  setTextMatchFilters as setProfileListingsTextMatchFilters,
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
  setMarketFilters as setCategoryDomainsMarketFilters,
  setTextMatchFilters as setCategoryDomainsTextMatchFilters,
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

// Import categoryPremium selectors and actions
import {
  emptyFilterState as emptyFilterStateCategoryPremiumFilters,
  selectCategoryPremiumFilters,
  setFiltersOpen as setCategoryPremiumFiltersOpen,
  toggleFiltersType as toggleCategoryPremiumFiltersType,
  setFiltersType as setCategoryPremiumFiltersType,
  setMarketFilters as setCategoryPremiumMarketFilters,
  setTextMatchFilters as setCategoryPremiumTextMatchFilters,
  setFiltersLength as setCategoryPremiumFiltersLength,
  setPriceDenomination as setCategoryPremiumPriceDenomination,
  setPriceRange as setCategoryPremiumPriceRange,
  toggleCategory as toggleCategoryPremiumCategory,
  setFiltersCategory as setCategoryPremiumFiltersCategory,
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
  setFiltersLength as setCategoryAvailableFiltersLength,
  setPriceDenomination as setCategoryAvailablePriceDenomination,
  setPriceRange as setCategoryAvailablePriceRange,
  toggleCategory as toggleCategoryAvailableCategory,
  setFiltersCategory as setCategoryAvailableFiltersCategory,
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

export function useFilterRouter(): FilterRouter<FilterContextType> {
  const { filterType } = useFilterContext()
  const profileState = useAppSelector(selectUserProfile)
  const marketplaceState = useAppSelector(selectMarketplace)
  const categoryState = useAppSelector(selectCategory)
  const filterPanelState = useAppSelector(selectFilterPanel)

  // Determine which tab is active in profile
  const activeProfileTab = profileState.selectedTab?.value || 'domains'
  // Determine which tab is active in marketplace
  const activeMarketplaceTab = marketplaceState.selectedTab?.value || 'names'
  // Determine which tab is active in category
  const activeCategoryTab = categoryState.selectedTab?.value || 'names'

  // Select appropriate filters depending on context
  const filters = useAppSelector((state: RootState) => {
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
      if (activeCategoryTab === 'names') {
        return {
          setFiltersOpen: setCategoryDomainsFiltersOpen,
          toggleFiltersStatus: toggleCategoryDomainsFiltersStatus,
          setFiltersStatus: setCategoryDomainsFiltersStatus,
          toggleFiltersType: toggleCategoryDomainsFiltersType,
          setFiltersType: setCategoryDomainsFiltersType,
          setMarketFilters: setCategoryDomainsMarketFilters,
          setTextMatchFilters: setCategoryDomainsTextMatchFilters,
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
      } else if (activeCategoryTab === 'premium') {
        return {
          setFiltersOpen: setCategoryPremiumFiltersOpen,
          toggleFiltersType: toggleCategoryPremiumFiltersType,
          setFiltersType: setCategoryPremiumFiltersType,
          setMarketFilters: setCategoryPremiumMarketFilters,
          setTextMatchFilters: setCategoryPremiumTextMatchFilters,
          setFiltersLength: setCategoryPremiumFiltersLength,
          setPriceDenomination: setCategoryPremiumPriceDenomination,
          setPriceRange: setCategoryPremiumPriceRange,
          toggleCategory: toggleCategoryPremiumCategory,
          setFiltersCategory: setCategoryPremiumFiltersCategory,
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
          setFiltersLength: setCategoryAvailableFiltersLength,
          setPriceDenomination: setCategoryAvailablePriceDenomination,
          setPriceRange: setCategoryAvailablePriceRange,
          toggleCategory: toggleCategoryAvailableCategory,
          setFiltersCategory: setCategoryAvailableFiltersCategory,
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
          setMarketFilters: setProfileDomainsMarketFilters,
          setTextMatchFilters: setProfileDomainsTextMatchFilters,
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
          setMarketFilters: setProfileListingsMarketFilters,
          setTextMatchFilters: setProfileListingsTextMatchFilters,
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
          setMarketFilters: setMyOffersMarketFilters,
          setTextMatchFilters: setMyOffersTextMatchFilters,
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
          setMarketFilters: setReceivedOffersMarketFilters,
          setTextMatchFilters: setReceivedOffersTextMatchFilters,
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
          setMarketFilters: setWatchlistMarketFilters,
          setTextMatchFilters: setWatchlistTextMatchFilters,
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
        setMarketFilters: setProfileDomainsMarketFilters,
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
        setMarketFilters: setMarketplaceMarketFilters,
        setTextMatchFilters: setMarketplaceTextMatchFilters,
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
      setMarketFilters: setMarketplaceMarketFilters,
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
  }, [filterType, activeProfileTab, activeMarketplaceTab, activeCategoryTab])

  const emptyFilterState = useMemo(() => {
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
  }, [filterType, activeProfileTab, activeMarketplaceTab, activeCategoryTab])

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
    isFiltersClear,
  }
}
