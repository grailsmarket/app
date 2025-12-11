import { Address } from 'viem'
import { useMemo } from 'react'
import { useAppSelector } from '@/state/hooks'
import { selectUserProfile } from '@/state/reducers/portfolio/profile'
import { useReceivedOffers } from './useReceivedOffers'
import { useSentOffers } from './useSentOffers'
import { DomainOfferType } from '@/types/domains'
import {
  PORTFOLIO_RECEIVED_OFFERS_DISPLAYED_COLUMNS,
  PORTFOLIO_MY_OFFERS_DISPLAYED_COLUMNS,
} from '@/constants/domains/marketplaceDomains'

// Router for the portfolio tab content
// This is done to prevent refetching data when switching tabs
export const useOffers = (user: Address | undefined) => {
  const { selectedTab } = useAppSelector(selectUserProfile)
  const {
    receivedOffers,
    totalReceivedOffers,
    isReceivedOffersLoading,
    isReceivedOffersFetchingNextPage,
    fetchMoreReceivedOffers,
    hasMoreReceivedOffers,
  } = useReceivedOffers(user)
  const {
    sentOffers,
    totalSentOffers,
    isSentOffersLoading,
    isSentOffersFetchingNextPage,
    fetchMoreSentOffers,
    hasMoreSentOffers,
  } = useSentOffers(user)

  const displayedDetails = useMemo(() => {
    switch (selectedTab.value) {
      case 'sent_offers':
        return PORTFOLIO_MY_OFFERS_DISPLAYED_COLUMNS
      case 'received_offers':
        return PORTFOLIO_RECEIVED_OFFERS_DISPLAYED_COLUMNS
      default:
        return PORTFOLIO_MY_OFFERS_DISPLAYED_COLUMNS
    }
  }, [selectedTab.value])

  const offersData = useMemo(() => {
    switch (selectedTab.value) {
      case 'sent_offers':
        return sentOffers
      case 'received_offers':
        return receivedOffers
      default:
        return sentOffers
    }
  }, [selectedTab.value, sentOffers, receivedOffers])

  const offers = useMemo(() => {
    return (
      offersData?.pages?.reduce((acc, page) => {
        return [...acc, ...page.offers]
      }, [] as DomainOfferType[]) || []
    )
  }, [offersData])

  const offersLoading = useMemo(() => {
    switch (selectedTab.value) {
      case 'sent_offers':
        return isSentOffersLoading || isSentOffersFetchingNextPage
      case 'received_offers':
        return isReceivedOffersLoading || isReceivedOffersFetchingNextPage
      default:
        return isSentOffersLoading || isSentOffersFetchingNextPage
    }
  }, [
    selectedTab.value,
    isSentOffersLoading,
    isSentOffersFetchingNextPage,
    isReceivedOffersLoading,
    isReceivedOffersFetchingNextPage,
  ])

  const fetchMoreOffers = useMemo(() => {
    switch (selectedTab.value) {
      case 'sent_offers':
        return fetchMoreSentOffers
      case 'received_offers':
        return fetchMoreReceivedOffers
      default:
        return fetchMoreSentOffers
    }
  }, [selectedTab.value, fetchMoreSentOffers, fetchMoreReceivedOffers])

  const hasMoreOffers = useMemo(() => {
    switch (selectedTab.value) {
      case 'sent_offers':
        return hasMoreSentOffers
      case 'received_offers':
        return hasMoreReceivedOffers
      default:
        return hasMoreSentOffers
    }
  }, [selectedTab.value, hasMoreSentOffers, hasMoreReceivedOffers])

  return {
    displayedDetails,
    offers,
    offersLoading,
    fetchMoreOffers,
    hasMoreOffers,
    totalReceivedOffers,
    totalSentOffers,
  }
}
