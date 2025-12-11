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

  const displayedDetails = useMemo(() => {
    switch (selectedTab.value) {
      case 'domains':
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
      case 'watchlist':
        return watchlistDomains
      default:
        return profileDomains
    }
  }, [selectedTab.value, profileDomains, watchlistDomains])

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
      case 'watchlist':
        return isWatchlistDomainsLoading || isWatchlistDomainsFetchingNextPage
      default:
        return profileDomainsLoading
    }
  }, [selectedTab.value, profileDomainsLoading, isWatchlistDomainsLoading, isWatchlistDomainsFetchingNextPage])

  const fetchMoreDomains = useMemo(() => {
    switch (selectedTab.value) {
      case 'domains':
        return profileFetchMoreDomains
      case 'watchlist':
        return fetchMoreWatchlistDomains
      default:
        return profileFetchMoreDomains
    }
  }, [selectedTab.value, profileFetchMoreDomains, fetchMoreWatchlistDomains])

  const hasMoreDomains = useMemo(() => {
    switch (selectedTab.value) {
      case 'domains':
        return profileHasMoreDomains
      case 'watchlist':
        return hasMoreWatchlistDomains
      default:
        return profileHasMoreDomains
    }
  }, [selectedTab.value, profileHasMoreDomains, hasMoreWatchlistDomains])

  return {
    displayedDetails,
    domains,
    domainsLoading,
    fetchMoreDomains,
    hasMoreDomains,
    profileTotalDomains,
    totalWatchlistDomains,
  }
}
