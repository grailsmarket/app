'use client'

import React from 'react'
import CreateListingModal from '@/components/modal/listing/createListingModal'
import MakeOfferModal from '@/components/modal/offer/makeOfferModal'
import BuyNowModal from '@/components/modal/purchase/buyNowModal'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { selectAcceptOfferModal } from '@/state/reducers/modals/acceptOfferModal'
import { selectCancelOfferModal } from '@/state/reducers/modals/cancelOfferModal'
import { selectBuyNowModal, setBuyNowModalOpen } from '@/state/reducers/modals/buyNowModal'
import { selectMakeListingModal, setMakeListingModalOpen } from '@/state/reducers/modals/makeListingModal'
import { selectMakeOfferModal, setMakeOfferModalOpen } from '@/state/reducers/modals/makeOfferModal'

const Modals: React.FC = () => {
  const dispatch = useAppDispatch()
  const { open: acceptOfferModalOpen, offer: acceptOfferModalOffer } = useAppSelector(selectAcceptOfferModal)
  const { open: createListingModalOpen, domain: createListingModalDomain } = useAppSelector(selectMakeListingModal)
  const { open: makeOfferModalOpen, domain: makeOfferModalDomain } = useAppSelector(selectMakeOfferModal)
  const { open: cancelOfferModalOpen, offer: cancelOfferModalOffer } = useAppSelector(selectCancelOfferModal)
  const { open: buyNowModalOpen, listing: buyNowModalListing } = useAppSelector(selectBuyNowModal)

  return (
    <div>
      {makeOfferModalOpen && <MakeOfferModal onClose={() => dispatch(setMakeOfferModalOpen(false))} domain={makeOfferModalDomain} />}
      {createListingModalOpen && <CreateListingModal onClose={() => dispatch(setMakeListingModalOpen(false))} domain={createListingModalDomain} />}
      {buyNowModalOpen && <BuyNowModal onClose={() => dispatch(setBuyNowModalOpen(false))} listing={buyNowModalListing} />}
    </div>
  )
}

export default Modals;