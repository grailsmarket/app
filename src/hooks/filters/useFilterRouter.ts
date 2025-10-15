import { RootState } from '@/state'
import { useAppSelector } from '@/state/hooks'
import { useFilterContext } from '@/contexts/FilterContext'
import { FilterRouter, FilterContextType } from '@/types/filters'

// Import marketplace selectors and actions
import {
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
  toggleMarketplaceFilterOpen,
  clearMarketplaceFilters,
} from '@/state/reducers/filters/marketplaceFilters'

// Import myDomains selectors and actions
import {
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
  toggleMyDomainsFilterOpen,
  clearMyDomainsFilters,
} from '@/state/reducers/filters/myDomainsFilters'

// Import myOffers selectors and actions
import {
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
  toggleMyOffersFilterOpen,
  clearMyOffersFilters,
} from '@/state/reducers/filters/myOffersFilters'

// Import receivedOffers selectors and actions
import {
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
  toggleReceivedOffersFilterOpen,
  clearReceivedOffersFilters,
} from '@/state/reducers/filters/receivedOffersFilters'

// Import watchlist selectors and actions
import {
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
  toggleWatchlistFilterOpen,
  clearWatchlistFilters,
} from '@/state/reducers/filters/watchlistFilters'

// Import profile selector for portfolio tabs
import { selectUserProfile } from '@/state/reducers/profile/profile'
import { useMemo } from 'react'

export function useFilterRouter(): FilterRouter<FilterContextType> {
  const { filterType, portfolioTab } = useFilterContext()
  const profileState = useAppSelector(selectUserProfile)

  // Determine which tab is active in portfolio
  const activePortfolioTab = portfolioTab || profileState.selectedTab?.value || 'domains'

  console.log('activePortfolioTab', activePortfolioTab)

  // Select the appropriate filters based on context
  const filters = useAppSelector((state: RootState) => {
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

  console.log('filters', filters)

  // Return the appropriate actions based on context
  const actions = useMemo(() => {
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
      toggleFilterOpen: toggleMarketplaceFilterOpen,
      clearFilters: clearMarketplaceFilters,
    }
  }, [filterType, portfolioTab])

  return {
    selectors: {
      filters: filters as any,
    },
    actions: actions as any,
    context: filterType,
    portfolioTab: activePortfolioTab,
  }
}
