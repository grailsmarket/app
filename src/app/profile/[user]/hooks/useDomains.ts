import { useAppSelector } from '@/state/hooks'
import { selectUserProfile } from '@/state/reducers/portfolio/profile'
import { useMemo } from 'react'
import { useWatchlistDomains } from './useWatchlistDomains'
import { MarketplaceDomainType } from '@/types/domains'
import {
  PORTFOLIO_WATCHLIST_DISPLAYED_COLUMNS,
  PORTFOLIO_MY_DOMAINS_DISPLAYED_COLUMNS,
} from '@/constants/domains/marketplaceDomains'
import { useProfileDomains } from './useProfileDomains'
import { Address } from 'viem'
import { useListings } from './useListings'

// Router for the portfolio tab content
// This is done to prevent refetching data when switching tabs
export const useDomains = (user: Address | undefined) => {
  const { selectedTab } = useAppSelector(selectUserProfile)

  const {
    domains: profileDomains,
    domainsLoading: profileDomainsLoading,
    fetchMoreDomains: profileFetchMoreDomains,
    hasMoreDomains: profileHasMoreDomains,
    totalDomains: profileTotalDomains,
  } = useProfileDomains(user)

  const {
    watchlistDomains,
    totalWatchlistDomains,
    isWatchlistDomainsLoading,
    isWatchlistDomainsFetchingNextPage,
    fetchMoreWatchlistDomains,
    hasMoreWatchlistDomains,
  } = useWatchlistDomains(user)

  const { listings, totalListings, listingsLoading, fetchMoreListings, hasMoreListings } = useListings(user)

  const displayedDetails = useMemo(() => {
    switch (selectedTab.value) {
      case 'domains':
        return PORTFOLIO_MY_DOMAINS_DISPLAYED_COLUMNS
      case 'listings':
        return PORTFOLIO_MY_DOMAINS_DISPLAYED_COLUMNS
      case 'watchlist':
        return PORTFOLIO_WATCHLIST_DISPLAYED_COLUMNS
      default:
        return PORTFOLIO_MY_DOMAINS_DISPLAYED_COLUMNS
    }
  }, [selectedTab.value])

  const domainsData = useMemo(() => {
    switch (selectedTab.value) {
      case 'domains':
        return profileDomains
      case 'listings':
        return listings
      case 'watchlist':
        return watchlistDomains
      default:
        return profileDomains
    }
  }, [selectedTab.value, profileDomains, watchlistDomains, listings])

  const domains = useMemo(() => {
    return (
      domainsData?.pages?.reduce((acc, page) => {
        return [...acc, ...page.domains]
      }, [] as MarketplaceDomainType[]) || []
    )
  }, [domainsData])

  const domainsLoading = useMemo(() => {
    switch (selectedTab.value) {
      case 'domains':
        return profileDomainsLoading
      case 'listings':
        return listingsLoading
      case 'watchlist':
        return isWatchlistDomainsLoading || isWatchlistDomainsFetchingNextPage
      default:
        return profileDomainsLoading
    }
  }, [
    selectedTab.value,
    profileDomainsLoading,
    listingsLoading,
    isWatchlistDomainsLoading,
    isWatchlistDomainsFetchingNextPage,
  ])

  const fetchMoreDomains = useMemo(() => {
    switch (selectedTab.value) {
      case 'domains':
        return profileFetchMoreDomains
      case 'listings':
        return fetchMoreListings
      case 'watchlist':
        return fetchMoreWatchlistDomains
      default:
        return profileFetchMoreDomains
    }
  }, [selectedTab.value, profileFetchMoreDomains, fetchMoreListings, fetchMoreWatchlistDomains])

  const hasMoreDomains = useMemo(() => {
    switch (selectedTab.value) {
      case 'domains':
        return profileHasMoreDomains
      case 'listings':
        return hasMoreListings
      case 'watchlist':
        return hasMoreWatchlistDomains
      default:
        return profileHasMoreDomains
    }
  }, [selectedTab.value, profileHasMoreDomains, hasMoreListings, hasMoreWatchlistDomains])

  return {
    displayedDetails,
    domains,
    domainsLoading,
    fetchMoreDomains,
    hasMoreDomains,
    profileTotalDomains,
    totalWatchlistDomains,
    totalListings,
  }
}
