import React from 'react'
import { Cross } from 'ethereum-identity-kit'
import PrimaryButton from './buttons/primary'
import SecondaryButton from './buttons/secondary'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { setTransferModalDomains, setTransferModalOpen } from '@/state/reducers/modals/transferModal'
import { setBulkRenewalModalDomains, setBulkRenewalModalOpen } from '@/state/reducers/modals/bulkRenewalModal'
import { clearBulkSelect, selectBulkSelect, setBulkSelectIsSelecting } from '@/state/reducers/modals/bulkSelectModal'
import {
  CancelListingListing,
  setCancelListingModalOpen,
  setCancelListingModalListings,
} from '@/state/reducers/modals/cancelListingModal'
import {
  setMakeListingModalDomains,
  setMakeListingModalOpen,
  setMakeListingModalPreviousListings,
} from '@/state/reducers/modals/makeListingModal'
import { selectUserProfile } from '@/state/reducers/portfolio/profile'

interface BulkSelectProps {
  isMyProfile: boolean
}

const BulkSelect: React.FC<BulkSelectProps> = ({ isMyProfile }) => {
  const dispatch = useAppDispatch()
  const { isSelecting, domains: selectedDomains, previousListings } = useAppSelector(selectBulkSelect)
  const { selectedTab } = useAppSelector(selectUserProfile)

  const handleBulkSelect = () => {
    dispatch(setBulkSelectIsSelecting(true))
  }

  const handleCancelBulkSelect = () => {
    dispatch(setBulkSelectIsSelecting(false))
    dispatch(clearBulkSelect())
  }

  const handleListAction = () => {
    dispatch(setMakeListingModalDomains(selectedDomains))
    dispatch(setMakeListingModalPreviousListings(previousListings))
    dispatch(setMakeListingModalOpen(true))
  }

  const handleExtendAction = () => {
    dispatch(setBulkRenewalModalDomains(selectedDomains))
    dispatch(setBulkRenewalModalOpen(true))
  }

  const handleTransferAction = () => {
    const transferDomains = selectedDomains.map((domain) => ({
      name: domain.name,
      tokenId: domain.token_id,
      owner: domain.owner,
      expiry_date: domain.expiry_date,
    }))
    dispatch(setTransferModalDomains(transferDomains))
    dispatch(setTransferModalOpen(true))
  }

  const handleCancelListingsAction = () => {
    // Transform previousListings (DomainListingType) to CancelListingListing format
    // We need to match each listing with its domain name
    const cancelListings: CancelListingListing[] = previousListings.map((listing) => {
      const domain = selectedDomains.find((d) => d.listings?.some((l) => l.id === listing.id))

      return {
        id: listing.id,
        name: domain?.name ?? '',
        price: listing.price,
        currency: listing.currency_address,
        expires: listing.expires_at,
        source: listing.source,
      }
    })
    dispatch(setCancelListingModalListings(cancelListings))
    dispatch(setCancelListingModalOpen(true))
  }

  const canListDomains = selectedTab.value === 'domains' || selectedTab.value === 'listings'
  const canExtendDomains =
    selectedTab.value === 'domains' || selectedTab.value === 'listings' || selectedTab.value === 'grace'
  const canTransferDomains =
    selectedTab.value === 'domains' || selectedTab.value === 'listings' || selectedTab.value === 'grace'
  const canCancelListings = selectedTab.value === 'domains' || selectedTab.value === 'listings'

  if (selectedTab.value !== 'domains' && selectedTab.value !== 'listings' && selectedTab.value !== 'grace') return null

  return (
    <div className='bulk-select-container fixed right-1 bottom-1 flex max-w-[calc(100%-8px)] flex-col items-end justify-end gap-1.5 bg-transparent px-1 sm:right-2 sm:bottom-2 sm:flex-row-reverse sm:gap-2 md:right-4 md:bottom-4'>
      {isSelecting ? (
        <>
          <div className='bg-background flex flex-row gap-1.5 rounded-md p-2 shadow-xl sm:hidden'>
            <SecondaryButton className='hover:bg-background-hover flex h-9 min-w-9 cursor-auto items-center justify-center bg-transparent p-0! text-2xl text-nowrap md:h-10 md:min-w-10'>
              {selectedDomains.length}
            </SecondaryButton>
            <SecondaryButton
              onClick={handleCancelBulkSelect}
              className='flex w-9 min-w-9 items-center justify-center p-0! md:w-10'
            >
              <Cross className='h-3 w-3' />
            </SecondaryButton>
          </div>

          <div className='shadow-bulk bg-background flex max-w-full flex-row overflow-x-scroll rounded-md'>
            {/* <SecondaryButton className='h-9 min-w-9 items-center justify-center p-0! text-xl text-nowrap md:h-10 md:min-w-10 hidden sm:flex'>
              {selectedDomains.length}
            </SecondaryButton> */}
            <div className='flex flex-row gap-1.5 p-2 sm:p-3'>
              {canExtendDomains && (
                <PrimaryButton onClick={handleExtendAction} disabled={selectedDomains.length === 0}>
                  Extend
                </PrimaryButton>
              )}
              {isMyProfile && canTransferDomains && (
                <PrimaryButton onClick={handleTransferAction} disabled={selectedDomains.length === 0}>
                  Transfer
                </PrimaryButton>
              )}
              {isMyProfile && canListDomains && (
                <PrimaryButton onClick={handleListAction} disabled={selectedDomains.length === 0}>
                  List
                </PrimaryButton>
              )}
              {isMyProfile && canCancelListings && (
                <PrimaryButton onClick={handleCancelListingsAction} disabled={previousListings.length === 0}>
                  <p className='text-nowrap'>({previousListings.length}) Cancel Listings</p>
                </PrimaryButton>
              )}
            </div>
            <div className='bg-background border-tertiary hidden flex-row gap-1.5 border-l-2 p-3 pl-1.5 sm:flex'>
              <SecondaryButton className='hover:bg-background-hover flex h-9 min-w-9 cursor-auto items-center justify-center bg-transparent p-0! text-2xl text-nowrap md:h-10 md:min-w-10'>
                {selectedDomains.length}
              </SecondaryButton>
              <SecondaryButton
                onClick={handleCancelBulkSelect}
                className='hidden w-28 items-center justify-center sm:flex'
              >
                Close
              </SecondaryButton>
              {/* <SecondaryButton
                onClick={handleCancelBulkSelect}
                className=' flex w-9 min-w-9 items-center justify-center p-0! md:w-10'
              >
                <Cross className='h-3 w-3' />
              </SecondaryButton> */}
            </div>
            {/* <SecondaryButton
              onClick={handleCancelBulkSelect}
              className='w-9 min-w-9 items-center justify-center p-0! md:w-10 hidden sm:flex'
            >
              <Cross className='h-3 w-3' />
            </SecondaryButton> */}
          </div>
        </>
      ) : (
        <div className='shadow-bulk bg-background rounded-md p-2 sm:p-3'>
          <PrimaryButton onClick={handleBulkSelect} className='w-28'>
            Bulk Select
          </PrimaryButton>
        </div>
      )}
    </div>
  )
}

export default BulkSelect
