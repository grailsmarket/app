'use client'

import React from 'react'
import CreateListingModal from '@/components/modal/listing/createListingModal'
import MakeOfferModal from '@/components/modal/offer/makeOfferModal'
import BuyNowModal from '@/components/modal/offer/purchase/buyNowModal'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { selectAcceptOfferModal } from '@/state/reducers/modals/acceptOfferModal'
import { selectCancelOfferModal } from '@/state/reducers/modals/cancelOfferModal'
import { selectBuyNowModal, setBuyNowModalOpen } from '@/state/reducers/modals/buyNowModal'
import { selectMakeListingModal, setMakeListingModalOpen } from '@/state/reducers/modals/makeListingModal'
import { selectMakeOfferModal, setMakeOfferModalOpen } from '@/state/reducers/modals/makeOfferModal'
import { selectCancelListingModal, setCancelListingModalOpen } from '@/state/reducers/modals/cancelListingModal'
import CancelListingModal from '@/components/modal/listing/cancelListingModal'

const Modals: React.FC = () => {
  const dispatch = useAppDispatch()
  const { open: acceptOfferModalOpen, offer: acceptOfferModalOffer } = useAppSelector(selectAcceptOfferModal)
  const { open: createListingModalOpen, domain: createListingModalDomain } = useAppSelector(selectMakeListingModal)
  const { open: makeOfferModalOpen, domain: makeOfferModalDomain } = useAppSelector(selectMakeOfferModal)
  const { open: cancelOfferModalOpen, offer: cancelOfferModalOffer } = useAppSelector(selectCancelOfferModal)
  const { open: cancelListingModalOpen, listing: cancelListingModalListing } = useAppSelector(selectCancelListingModal)
  const { open: buyNowModalOpen, listing: buyNowModalListing } = useAppSelector(selectBuyNowModal)

  return (
    <div>
      {makeOfferModalOpen && (
        <MakeOfferModal onClose={() => dispatch(setMakeOfferModalOpen(false))} domain={makeOfferModalDomain} />
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
        <BuyNowModal onClose={() => dispatch(setBuyNowModalOpen(false))} listing={buyNowModalListing} />
      )}
    </div>
  )
}

export default Modals
