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
import NotificationModal from '@/components/modal/notifications/notificationModal'
import { selectNotificationModal, setNotificationModalOpen } from '@/state/reducers/modals/notificationModal'
import ExtendModal from '@/components/modal/renewal/extendModal'
import { selectBulkRenewalModal, setBulkRenewalModalOpen } from '@/state/reducers/modals/bulkRenewalModal'
import SettingsModal from '@/components/modal/settings/settingsModal'
import { useUserContext } from '@/context/user'
import TransferModal from '@/components/modal/transfer/transferModal'
import { selectTransferModal, setTransferModalOpen } from '@/state/reducers/modals/transferModal'
import RegistrationModal from '@/components/modal/registration/registrationModal'
import ShareModal from '@/components/modal/share/shareModal'
import { selectShareModal, setShareModalOpen } from '@/state/reducers/modals/shareModal'
import EditRecordsModal from '@/components/modal/records/editRecordsModal'
import { selectEditRecordsModal, setEditRecordsModalOpen } from '@/state/reducers/modals/editRecordsModal'
import { useGlobalSearchShortcut } from '@/hooks/useGlobalSearchShortcut'
import { selectListSettingsModal, setListSettingsModalOpen } from '@/state/reducers/modals/listSettingsModal'
import ListSettings from '@/components/modal/list-settings'

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
    metadata: editRecordsModalMetadata,
  } = useAppSelector(selectEditRecordsModal)
  const { isSettingsOpen, setIsSettingsOpen } = useUserContext()
  const { open: listSettingsModalOpen, user: listSettingsModalUser, list: listSettingsModalList } = useAppSelector(selectListSettingsModal)

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
          domains={createListingModalDomains}
          previousListings={previousListings}
        />
      )}
      {cancelListingModalOpen && (
        <CancelListingModal
          onClose={() => dispatch(setCancelListingModalOpen(false))}
          listings={cancelListingModalListings}
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
      <NotificationModal isOpen={notificationModalOpen} onClose={() => dispatch(setNotificationModalOpen(false))} />
      {bulkRenewalModalOpen && <ExtendModal onClose={() => dispatch(setBulkRenewalModalOpen(false))} />}
      {transferModalOpen && (
        <TransferModal
          domains={transferModalDomains}
          onClose={() => {
            dispatch(setTransferModalOpen(false))
          }}
        />
      )}
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
      {editRecordsModalOpen && editRecordsModalName && (
        <EditRecordsModal
          name={editRecordsModalName}
          metadata={editRecordsModalMetadata}
          onClose={() => dispatch(setEditRecordsModalOpen(false))}
        />
      )}
      {isSettingsOpen && <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />}
      {listSettingsModalOpen && listSettingsModalUser && listSettingsModalList && <ListSettings onClose={() => dispatch(setListSettingsModalOpen(false))} profile={listSettingsModalUser} selectedList={listSettingsModalList} />}
    </div>
  )
}

export default Modals
