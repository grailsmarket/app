'use client'

import React from 'react'
import CreateListingModal from '@/components/modal/listing/createListingModal'
import BuyNowModal from '@/components/modal/purchase/buyNowModal'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { selectAcceptOfferModal, setAcceptOfferModalOpen } from '@/state/reducers/modals/acceptOfferModal'
import { selectCancelOfferModal, setCancelOfferModalOpen } from '@/state/reducers/modals/cancelOfferModal'
import { selectBuyNowModal, setBuyNowModalOpen } from '@/state/reducers/modals/buyNowModal'
import { selectMakeListingModal, setMakeListingModalOpen } from '@/state/reducers/modals/makeListingModal'
import { selectMakeOfferModal, setMakeOfferModalOpen } from '@/state/reducers/modals/makeOfferModal'
import { selectCancelListingModal, setCancelListingModalOpen } from '@/state/reducers/modals/cancelListingModal'
import CancelListingModal from '@/components/modal/listing/cancelListingModal'
import CreateOfferModal from '@/components/modal/offer/createOfferModal'
import CancelOfferModal from '@/components/modal/offer/cancelOfferModal'
import AcceptOfferModal from '@/components/modal/offer/acceptOfferModal'
import GlobalSearchModal from '@/components/modal/search/globalSearchModal'
import { selectSearchModal, setSearchModalOpen } from '@/state/reducers/modals/searchModal'

const Modals: React.FC = () => {
  const dispatch = useAppDispatch()
  const {
    open: acceptOfferModalOpen,
    offer: acceptOfferModalOffer,
    domain: acceptOfferModalDomain,
  } = useAppSelector(selectAcceptOfferModal)
  const { open: createListingModalOpen, domain: createListingModalDomain } = useAppSelector(selectMakeListingModal)
  const { open: makeOfferModalOpen, domain: makeOfferModalDomain } = useAppSelector(selectMakeOfferModal)
  const {
    open: cancelOfferModalOpen,
    offer: cancelOfferModalOffer,
    name: cancelOfferModalName,
  } = useAppSelector(selectCancelOfferModal)
  const { open: cancelListingModalOpen, listing: cancelListingModalListing } = useAppSelector(selectCancelListingModal)
  const {
    open: buyNowModalOpen,
    listing: buyNowModalListing,
    domain: buyNowModalDomain,
  } = useAppSelector(selectBuyNowModal)
  const { open: searchModalOpen, query: searchModalQuery } = useAppSelector(selectSearchModal)

  return (
    <div>
      {makeOfferModalOpen && (
        <CreateOfferModal onClose={() => dispatch(setMakeOfferModalOpen(false))} domain={makeOfferModalDomain} />
      )}
      {cancelOfferModalOpen && (
        <CancelOfferModal
          onClose={() => dispatch(setCancelOfferModalOpen(false))}
          name={cancelOfferModalName ?? ''}
          offer={cancelOfferModalOffer}
        />
      )}
      {createListingModalOpen && (
        <CreateListingModal
          onClose={() => dispatch(setMakeListingModalOpen(false))}
          domain={createListingModalDomain}
        />
      )}
      {cancelListingModalOpen && (
        <CancelListingModal
          onClose={() => dispatch(setCancelListingModalOpen(false))}
          listing={cancelListingModalListing}
        />
      )}
      {buyNowModalOpen && (
        <BuyNowModal
          onClose={() => dispatch(setBuyNowModalOpen(false))}
          listing={buyNowModalListing}
          domain={buyNowModalDomain}
        />
      )}
      {acceptOfferModalOpen && (
        <AcceptOfferModal
          onClose={() => dispatch(setAcceptOfferModalOpen(false))}
          offer={acceptOfferModalOffer}
          domain={acceptOfferModalDomain}
        />
      )}
      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => dispatch(setSearchModalOpen(false))}
        initialQuery={searchModalQuery}
      />
    </div>
  )
}

export default Modals
