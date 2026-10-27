'use client'

import React, { Suspense, useEffect } from 'react'
import { AnimatePresence } from 'motion/react'
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
import NotificationModal from '@/components/modal/notifications'
import { selectNotificationModal, setNotificationModalOpen } from '@/state/reducers/modals/notificationModal'
import ExtendModal from '@/components/modal/renewal/extendModal'
import { selectBulkRenewalModal, setBulkRenewalModalOpen } from '@/state/reducers/modals/bulkRenewalModal'
import TransferModal from '@/components/modal/transfer/transferModal'
import { selectTransferModal, setTransferModalOpen } from '@/state/reducers/modals/transferModal'
import RegistrationModal from '@/components/modal/registration'
import ShareModal from '@/components/modal/share/shareModal'
import { selectShareModal, setShareModalOpen } from '@/state/reducers/modals/shareModal'
import EditRecordsModal from '@/components/modal/records/editRecordsModal'
import { selectEditRecordsModal, setEditRecordsModalOpen } from '@/state/reducers/modals/editRecordsModal'
import BulkEditRecordsModal from '@/components/modal/records/bulkEditRecordsModal'
import { selectBulkEditRecordsModal, setBulkEditRecordsModalOpen } from '@/state/reducers/modals/bulkEditRecordsModal'
import { useGlobalSearchShortcut } from '@/hooks/useGlobalSearchShortcut'
import { useOpenSettingsFromUrl } from '@/hooks/useOpenSettingsFromUrl'
import { selectListSettingsModal, setListSettingsModalOpen } from '@/state/reducers/modals/listSettingsModal'
import ListSettings from '@/components/modal/list-settings'
import { selectRegistration } from '@/state/reducers/registration'
import ChatSocketMount from '@/components/chat/socketMount'

const OpenSettingsFromUrl: React.FC = () => {
  useOpenSettingsFromUrl()
  return null
}

const Modals: React.FC = () => {
  // Global keyboard shortcut: "/" to open search modal
  useGlobalSearchShortcut()
  const dispatch = useAppDispatch()
  const {
    open: acceptOfferModalOpen,
    offer: acceptOfferModalOffer,
    domain: acceptOfferModalDomain,
  } = useAppSelector(selectAcceptOfferModal)
  const {
    open: createListingModalOpen,
    domains: createListingModalDomains,
    previousListings,
  } = useAppSelector(selectMakeListingModal)
  const { open: makeOfferModalOpen, domain: makeOfferModalDomain } = useAppSelector(selectMakeOfferModal)
  const {
    open: cancelOfferModalOpen,
    offer: cancelOfferModalOffer,
    name: cancelOfferModalName,
  } = useAppSelector(selectCancelOfferModal)
  const { open: cancelListingModalOpen, listings: cancelListingModalListings } =
    useAppSelector(selectCancelListingModal)
  const {
    open: buyNowModalOpen,
    listing: buyNowModalListing,
    domain: buyNowModalDomain,
  } = useAppSelector(selectBuyNowModal)
  const { open: searchModalOpen, query: searchModalQuery } = useAppSelector(selectSearchModal)
  const { open: notificationModalOpen } = useAppSelector(selectNotificationModal)
  const { open: bulkRenewalModalOpen } = useAppSelector(selectBulkRenewalModal)
  const { open: transferModalOpen, domains: transferModalDomains } = useAppSelector(selectTransferModal)
  const {
    open: shareModalOpen,
    type: shareModalType,
    listing: shareModalListing,
    offer: shareModalOffer,
    domainName: shareModalDomainName,
    ownerAddress: shareModalOwnerAddress,
    categories: shareModalCategories,
  } = useAppSelector(selectShareModal)
  const {
    open: editRecordsModalOpen,
    name: editRecordsModalName,
    version: editRecordsModalVersion,
    metadata: editRecordsModalMetadata,
    defaultTab: editRecordsModalDefaultTab,
  } = useAppSelector(selectEditRecordsModal)
  const { open: bulkEditRecordsModalOpen, names: bulkEditRecordsModalNames } =
    useAppSelector(selectBulkEditRecordsModal)
  const {
    open: listSettingsModalOpen,
    user: listSettingsModalUser,
    list: listSettingsModalList,
  } = useAppSelector(selectListSettingsModal)
  const { isOpen: registrationModalOpen } = useAppSelector(selectRegistration)

  const anyModalOpen =
    makeOfferModalOpen ||
    cancelOfferModalOpen ||
    createListingModalOpen ||
    cancelListingModalOpen ||
    buyNowModalOpen ||
    acceptOfferModalOpen ||
    searchModalOpen ||
    notificationModalOpen ||
    bulkRenewalModalOpen ||
    transferModalOpen ||
    shareModalOpen ||
    editRecordsModalOpen ||
    listSettingsModalOpen ||
    registrationModalOpen

  useEffect(() => {
    if (anyModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [anyModalOpen])

  return (
    <div>
      <Suspense fallback={null}>
        <OpenSettingsFromUrl />
      </Suspense>
      <AnimatePresence>
        {makeOfferModalOpen && (
          <CreateOfferModal
            key='make-offer-modal'
            onClose={() => dispatch(setMakeOfferModalOpen(false))}
            domain={makeOfferModalDomain}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {cancelOfferModalOpen && (
          <CancelOfferModal
            key='cancel-offer-modal'
            onClose={() => dispatch(setCancelOfferModalOpen(false))}
            name={cancelOfferModalName ?? ''}
            offer={cancelOfferModalOffer}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {createListingModalOpen && (
          <CreateListingModal
            key='create-listing-modal'
            onClose={() => dispatch(setMakeListingModalOpen(false))}
            domains={createListingModalDomains}
            previousListings={previousListings}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {cancelListingModalOpen && (
          <CancelListingModal
            key='cancel-listing-modal'
            onClose={() => dispatch(setCancelListingModalOpen(false))}
            listings={cancelListingModalListings}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {buyNowModalOpen && (
          <BuyNowModal
            key='buy-now-modal'
            onClose={() => dispatch(setBuyNowModalOpen(false))}
            listing={buyNowModalListing}
            domain={buyNowModalDomain}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {acceptOfferModalOpen && (
          <AcceptOfferModal
            key='accept-offer-modal'
            onClose={() => dispatch(setAcceptOfferModalOpen(false))}
            offer={acceptOfferModalOffer}
            domain={acceptOfferModalDomain}
          />
        )}
      </AnimatePresence>
      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => dispatch(setSearchModalOpen(false))}
        initialQuery={searchModalQuery}
      />
      <NotificationModal isOpen={notificationModalOpen} onClose={() => dispatch(setNotificationModalOpen(false))} />
      <AnimatePresence>
        {bulkRenewalModalOpen && (
          <ExtendModal key='extend-modal' onClose={() => dispatch(setBulkRenewalModalOpen(false))} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {transferModalOpen && (
          <TransferModal
            key='transfer-modal'
            domains={transferModalDomains}
            onClose={() => {
              dispatch(setTransferModalOpen(false))
            }}
          />
        )}
      </AnimatePresence>
      <RegistrationModal />
      {shareModalOpen && (
        <ShareModal
          onClose={() => dispatch(setShareModalOpen(false))}
          type={shareModalType}
          listing={shareModalListing}
          offer={shareModalOffer}
          domainName={shareModalDomainName}
          ownerAddress={shareModalOwnerAddress}
          categories={shareModalCategories}
        />
      )}
      <AnimatePresence>
        {editRecordsModalOpen && editRecordsModalName && (
          <EditRecordsModal
            key='edit-records-modal'
            name={editRecordsModalName}
            version={editRecordsModalVersion}
            metadata={editRecordsModalMetadata}
            defaultTab={editRecordsModalDefaultTab}
            onClose={() => dispatch(setEditRecordsModalOpen(false))}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {bulkEditRecordsModalOpen && bulkEditRecordsModalNames.length > 0 && (
          <BulkEditRecordsModal
            key='bulk-edit-records-modal'
            names={bulkEditRecordsModalNames}
            onClose={() => dispatch(setBulkEditRecordsModalOpen(false))}
          />
        )}
      </AnimatePresence>
      {listSettingsModalOpen && listSettingsModalUser && listSettingsModalList && (
        <ListSettings
          onClose={() => dispatch(setListSettingsModalOpen(false))}
          profile={listSettingsModalUser}
          selectedList={listSettingsModalList}
        />
      )}
      <ChatSocketMount />
    </div>
  )
}

export default Modals
