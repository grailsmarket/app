import { useAppSelector } from '@/state/hooks'
import { selectUserProfile } from '@/state/reducers/portfolio/profile'
import { useMemo } from 'react'
import { DomainOfferType } from '@/types/domains'
import {
  PORTFOLIO_RECEIVED_OFFERS_DISPLAYED_COLUMNS,
  PORTFOLIO_MY_OFFERS_DISPLAYED_COLUMNS,
} from '@/constants/domains/marketplaceDomains'
import { useMyOffers } from './useMyOffers'
import { useReceivedOffers } from './useReceivedOffers'

// Router for the portfolio tab content
// This is done to prevent refetching data when switching tabs
export const useOffers = () => {
  const { selectedTab } = useAppSelector(selectUserProfile)
  const {
    receivedOffers,
    totalReceivedOffers,
    isReceivedOffersLoading,
    isReceivedOffersFetchingNextPage,
    fetchMoreReceivedOffers,
    hasMoreReceivedOffers,
  } = useReceivedOffers()
  const { myOffers, totalMyOffers, isMyOffersLoading, isMyOffersFetchingNextPage, fetchMoreMyOffers, hasMoreMyOffers } =
    useMyOffers()

  const displayedDetails = useMemo(() => {
    switch (selectedTab.value) {
      case 'my_offers':
        return PORTFOLIO_MY_OFFERS_DISPLAYED_COLUMNS
      case 'received_offers':
        return PORTFOLIO_RECEIVED_OFFERS_DISPLAYED_COLUMNS
      default:
        return PORTFOLIO_MY_OFFERS_DISPLAYED_COLUMNS
    }
  }, [selectedTab.value])

  const offersData = useMemo(() => {
    switch (selectedTab.value) {
      case 'my_offers':
        return myOffers
      case 'received_offers':
        return receivedOffers
      default:
        return myOffers
    }
  }, [selectedTab.value, myOffers, receivedOffers])

  const offers = useMemo(() => {
    return (
      offersData?.pages?.reduce((acc, page) => {
        return [...acc, ...page.offers]
      }, [] as DomainOfferType[]) || []
    )
  }, [offersData])

  const offersLoading = useMemo(() => {
    switch (selectedTab.value) {
      case 'my_offers':
        return isMyOffersLoading || isMyOffersFetchingNextPage
      case 'received_offers':
        return isReceivedOffersLoading || isReceivedOffersFetchingNextPage
      default:
        return isMyOffersLoading || isMyOffersFetchingNextPage
    }
  }, [
    selectedTab.value,
    isMyOffersLoading,
    isMyOffersFetchingNextPage,
    isReceivedOffersLoading,
    isReceivedOffersFetchingNextPage,
  ])

  const fetchMoreOffers = useMemo(() => {
    switch (selectedTab.value) {
      case 'my_offers':
        return fetchMoreMyOffers
      case 'received_offers':
        return fetchMoreReceivedOffers
      default:
        return fetchMoreMyOffers
    }
  }, [selectedTab.value, fetchMoreMyOffers, fetchMoreReceivedOffers])

  const hasMoreOffers = useMemo(() => {
    switch (selectedTab.value) {
      case 'my_offers':
        return hasMoreMyOffers
      case 'received_offers':
        return hasMoreReceivedOffers
      default:
        return hasMoreMyOffers
    }
  }, [selectedTab.value, hasMoreMyOffers, hasMoreReceivedOffers])

  return {
    displayedDetails,
    offers,
    offersLoading,
    fetchMoreOffers,
    hasMoreOffers,
    totalReceivedOffers,
    totalMyOffers,
  }
}
