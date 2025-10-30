import { useAppSelector } from '@/state/hooks'
import { selectUserProfile } from '@/state/reducers/portfolio/profile'
import { useMyDomains } from './useMyDomains'
import { useMemo } from 'react'
import { useWatchlistDomains } from './useWatchlistDomains'
import { MarketplaceDomainType } from '@/types/domains'
import {
  PORTFOLIO_WATCHLIST_DISPLAYED_COLUMNS,
  PORTFOLIO_MY_DOMAINS_DISPLAYED_COLUMNS,
} from '@/constants/domains/marketplaceDomains'

// Router for the portfolio tab content
// This is done to prevent refetching data when switching tabs
export const useDomains = () => {
  const { selectedTab } = useAppSelector(selectUserProfile)

  const { myDomains, isMyDomainsLoading, isMyDomainsFetchingNextPage, fetchMoreMyDomains, hasMoreMyDomains } =
    useMyDomains()

  const {
    watchlistDomains,
    isWatchlistDomainsLoading,
    isWatchlistDomainsFetchingNextPage,
    fetchMoreWatchlistDomains,
    hasMoreWatchlistDomains,
  } = useWatchlistDomains()

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
        return myDomains
      case 'watchlist':
        return watchlistDomains
      default:
        return myDomains
    }
  }, [selectedTab.value, myDomains, watchlistDomains])

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
        return isMyDomainsLoading || isMyDomainsFetchingNextPage
      case 'watchlist':
        return isWatchlistDomainsLoading || isWatchlistDomainsFetchingNextPage
      default:
        return isMyDomainsLoading || isMyDomainsFetchingNextPage
    }
  }, [
    selectedTab.value,
    isMyDomainsLoading,
    isMyDomainsFetchingNextPage,
    isWatchlistDomainsLoading,
    isWatchlistDomainsFetchingNextPage,
  ])

  const fetchMoreDomains = useMemo(() => {
    switch (selectedTab.value) {
      case 'domains':
        return fetchMoreMyDomains
      case 'watchlist':
        return fetchMoreWatchlistDomains
      default:
        return fetchMoreMyDomains
    }
  }, [selectedTab.value, fetchMoreMyDomains, fetchMoreWatchlistDomains])

  const hasMoreDomains = useMemo(() => {
    switch (selectedTab.value) {
      case 'domains':
        return hasMoreMyDomains
      case 'watchlist':
        return hasMoreWatchlistDomains
      default:
        return hasMoreMyDomains
    }
  }, [selectedTab.value, hasMoreMyDomains, hasMoreWatchlistDomains])

  return {
    displayedDetails,
    domains,
    domainsLoading,
    fetchMoreDomains,
    hasMoreDomains,
  }
}
