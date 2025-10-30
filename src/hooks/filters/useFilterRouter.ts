import _ from 'lodash'
import { RootState } from '@/state'
import { useAppSelector } from '@/state/hooks'
import { useFilterContext } from '@/context/filters'
import { FilterRouter, FilterContextType } from '@/types/filters'

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
  toggleMarketplaceFilterOpen,
  clearMarketplaceFilters,
} from '@/state/reducers/filters/marketplaceFilters'

// Import myDomains selectors and actions
import {
  emptyFilterState as emptyFilterStateMyDomainsFilters,
  selectMyDomainsFilters,
  setMyDomainsFiltersOpen,
  toggleMyDomainsFiltersStatus,
  setMyDomainsFiltersStatus,
  toggleMyDomainsFiltersType,
  setMyDomainsFiltersType,
  setMyDomainsFiltersLength,
  setMyDomainsPriceDenomination,
  setMyDomainsPriceRange,
  toggleMyDomainsCategory,
  setMyDomainsFiltersCategory,
  setMyDomainsSort,
  setMyDomainsSearch,
  toggleMyDomainsFilterOpen,
  clearMyDomainsFilters,
} from '@/state/reducers/filters/myDomainsFilters'

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
  toggleFilterOpen as toggleProfileDomainsFilterOpen,
  clearFilters as clearProfileDomainsFilters,
} from '@/state/reducers/filters/profileDomainsFilters'

import {
  emptyFilterState as emptyFilterStateProfileActivityFilters,
  selectProfileActivityFilters,
  toggleActivityFiltersType,
  setActivityFiltersType,
  toggleFilterOpen as toggleProfileActivityFilterOpen,
  setFiltersOpen as setProfileActivityFilterOpen,
  setSearch as setProfileActivitySearch,
  clearActivityFilters,
} from '@/state/reducers/filters/profileActivityFilters'

export function useFilterRouter(): FilterRouter<FilterContextType> {
  const { filterType, portfolioTab, profileTab } = useFilterContext()
  const profileState = useAppSelector(selectUserProfile)

  // Determine which tab is active in portfolio or profile
  const activePortfolioTab = portfolioTab || profileState.selectedTab?.value || 'domains'

  // Select appropriate filters depending on context
  const filters = useAppSelector((state: RootState) => {
    if (filterType === 'profile') {
      if (profileTab === 'domains') {
        return selectProfileDomainsFilters(state)
      } else if (profileTab === 'activity') {
        return selectProfileActivityFilters(state)
      }

      return selectProfileDomainsFilters(state)
    }

    if (filterType === 'portfolio') {
      if (activePortfolioTab === 'domains') {
        return selectMyDomainsFilters(state)
      } else if (activePortfolioTab === 'received_offers') {
        return selectReceivedOffersFilters(state)
      } else if (activePortfolioTab === 'my_offers') {
        return selectMyOffersFilters(state)
      } else if (activePortfolioTab === 'watchlist') {
        return selectWatchlistFilters(state)
      }

      return selectMyDomainsFilters(state)
    }

    return selectMarketplaceFilters(state)
  })

  // Return the appropriate actions based on context
  const actions = useMemo(() => {
    if (filterType === 'profile') {
      if (profileTab === 'domains') {
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
          toggleFilterOpen: toggleProfileDomainsFilterOpen,
          clearFilters: clearProfileDomainsFilters,
        }
      } else if (profileTab === 'activity') {
        return {
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
        toggleFilterOpen: toggleProfileDomainsFilterOpen,
        clearFilters: clearProfileDomainsFilters,
      }
    }

    if (filterType === 'portfolio') {
      if (portfolioTab === 'domains') {
        return {
          setFiltersOpen: setMyDomainsFiltersOpen,
          toggleFiltersStatus: toggleMyDomainsFiltersStatus,
          setFiltersStatus: setMyDomainsFiltersStatus,
          toggleFiltersType: toggleMyDomainsFiltersType,
          setFiltersType: setMyDomainsFiltersType,
          setFiltersLength: setMyDomainsFiltersLength,
          setPriceDenomination: setMyDomainsPriceDenomination,
          setPriceRange: setMyDomainsPriceRange,
          toggleCategory: toggleMyDomainsCategory,
          setFiltersCategory: setMyDomainsFiltersCategory,
          setSort: setMyDomainsSort,
          setSearch: setMyDomainsSearch,
          toggleFilterOpen: toggleMyDomainsFilterOpen,
          clearFilters: clearMyDomainsFilters,
        }
      } else if (portfolioTab === 'my_offers') {
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
          toggleFilterOpen: toggleMyOffersFilterOpen,
          clearFilters: clearMyOffersFilters,
        }
      } else if (portfolioTab === 'received_offers') {
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
          toggleFilterOpen: toggleReceivedOffersFilterOpen,
          clearFilters: clearReceivedOffersFilters,
        }
      } else if (portfolioTab === 'watchlist') {
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
          toggleFilterOpen: toggleWatchlistFilterOpen,
          clearFilters: clearWatchlistFilters,
        }
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
      toggleFilterOpen: toggleMarketplaceFilterOpen,
      clearFilters: clearMarketplaceFilters,
    }
  }, [filterType, portfolioTab, profileTab])

  const emptyFilterState = useMemo(() => {
    if (filterType === 'profile') {
      if (profileTab === 'domains') {
        return emptyFilterStateProfileDomainsFilters
      } else if (profileTab === 'activity') {
        return emptyFilterStateProfileActivityFilters
      }
    }

    if (filterType === 'portfolio') {
      if (portfolioTab === 'domains') {
        return emptyFilterStateMyDomainsFilters
      } else if (portfolioTab === 'my_offers') {
        return emptyFilterStateMyOffersFilters
      }
    } else if (portfolioTab === 'received_offers') {
      return emptyFilterStateReceivedOffersFilters
    } else if (portfolioTab === 'watchlist') {
      return emptyFilterStateWatchlistFilters
    }

    return emptyFilterStateMarketplaceFilters
  }, [filterType, portfolioTab, profileTab])

  const isFiltersClear = useMemo(() => {
    const filtersWithoutOpenFilters = _.omit(filters, 'openFilters')
    return _.isEqual(filtersWithoutOpenFilters, emptyFilterState)
  }, [filters, emptyFilterState])

  return {
    selectors: {
      filters: filters,
    },
    actions: actions as any,
    context: filterType,
    portfolioTab: activePortfolioTab,
    isFiltersClear,
  }
}
