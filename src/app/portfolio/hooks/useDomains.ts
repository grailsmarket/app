import { useAppSelector } from '@/state/hooks'
import { selectUserProfile } from '@/state/reducers/profile/profile'
import { useMyDomains } from './useMyDomains'
import { useMemo } from 'react'
import { useMyOffers } from './useMyOffers'
import { useReceivedOffers } from './useReceivedOffers'
import { useWatchlistDomains } from './useWatchlistDomains'
import { MarketplaceDomainType } from '@/types/domains'
import {
  PORTFOLIO_WATCHLIST_DISPLAYED_COLUMNS,
  PORTFOLIO_MY_DOMAINS_DISPLAYED_COLUMNS,
  PORTFOLIO_MY_OFFERS_DISPLAYED_COLUMNS,
  PORTFOLIO_RECEIVED_OFFERS_DISPLAYED_COLUMNS,
} from '@/constants/domains/marketplaceDomains'

// Router for the portfolio tab content
// This is done to prevent refetching data when switching tabs
export const useDomains = () => {
  const { selectedTab } = useAppSelector(selectUserProfile)

  const {
    myDomains,
    isMyDomainsLoading,
    isMyDomainsFetchingNextPage,
    fetchMoreMyDomains,
    hasMoreMyDomains,
  } = useMyDomains()

  const {
    receivedOffers,
    isReceivedOffersLoading,
    isReceivedOffersFetchingNextPage,
    fetchMoreReceivedOffers,
    hasMoreReceivedOffers,
  } = useReceivedOffers()

  const {
    myOffers,
    isMyOffersLoading,
    isMyOffersFetchingNextPage,
    fetchMoreMyOffers,
    hasMoreMyOffers,
  } = useMyOffers()

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
      case 'received_offers':
        return PORTFOLIO_RECEIVED_OFFERS_DISPLAYED_COLUMNS
      case 'my_offers':
        return PORTFOLIO_MY_OFFERS_DISPLAYED_COLUMNS
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
      case 'received_offers':
        return receivedOffers
      case 'my_offers':
        return myOffers
      case 'watchlist':
        return watchlistDomains
      default:
        return myDomains
    }
  }, [selectedTab.value, myDomains, receivedOffers, myOffers, watchlistDomains])

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
      case 'received_offers':
        return isReceivedOffersLoading || isReceivedOffersFetchingNextPage
      case 'my_offers':
        return isMyOffersLoading || isMyOffersFetchingNextPage
      case 'watchlist':
        return isWatchlistDomainsLoading || isWatchlistDomainsFetchingNextPage
      default:
        return isMyDomainsLoading || isMyDomainsFetchingNextPage
    }
  }, [
    selectedTab.value,
    isMyDomainsLoading,
    isMyDomainsFetchingNextPage,
    isReceivedOffersLoading,
    isReceivedOffersFetchingNextPage,
    isMyOffersLoading,
    isMyOffersFetchingNextPage,
    isWatchlistDomainsLoading,
    isWatchlistDomainsFetchingNextPage,
  ])

  const fetchMoreDomains = useMemo(() => {
    switch (selectedTab.value) {
      case 'domains':
        return fetchMoreMyDomains
      case 'received_offers':
        return fetchMoreReceivedOffers
      case 'my_offers':
        return fetchMoreMyOffers
      case 'watchlist':
        return fetchMoreWatchlistDomains
      default:
        return fetchMoreMyDomains
    }
  }, [selectedTab.value, fetchMoreMyDomains, fetchMoreReceivedOffers, fetchMoreMyOffers, fetchMoreWatchlistDomains])

  const hasMoreDomains = useMemo(() => {
    switch (selectedTab.value) {
      case 'domains':
        return hasMoreMyDomains
      case 'received_offers':
        return hasMoreReceivedOffers
      case 'my_offers':
        return hasMoreMyOffers
      case 'watchlist':
        return hasMoreWatchlistDomains
      default:
        return hasMoreMyDomains
    }
  }, [selectedTab.value, hasMoreMyDomains, hasMoreReceivedOffers, hasMoreMyOffers, hasMoreWatchlistDomains])


  return {
    displayedDetails,
    domains,
    domainsLoading,
    fetchMoreDomains,
    hasMoreDomains,
  }
}
