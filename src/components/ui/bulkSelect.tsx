import React from 'react'
import { Cross } from 'ethereum-identity-kit'
import PrimaryButton from './buttons/primary'
import SecondaryButton from './buttons/secondary'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { setTransferModalDomains, setTransferModalOpen } from '@/state/reducers/modals/transferModal'
import { setBulkRenewalModalDomains, setBulkRenewalModalOpen } from '@/state/reducers/modals/bulkRenewalModal'
import {
  clearBulkSelect,
  selectBulkSelect,
  setBulkSelectIsSelecting,
  clearSelectAllError,
} from '@/state/reducers/modals/bulkSelectModal'
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
import { selectCategory } from '@/state/reducers/category/category'
import { useSelectAll } from '@/context/selectAll'
import { DAY_IN_SECONDS } from '@/constants/time'
import { useUserContext } from '@/context/user'

interface BulkSelectProps {
  isMyProfile?: boolean
  pageType?: 'profile' | 'category'
}

const BulkSelect: React.FC<BulkSelectProps> = ({ pageType = 'profile' }) => {
  const dispatch = useAppDispatch()
  const { isSelecting, domains: selectedDomains, previousListings, selectAll } = useAppSelector(selectBulkSelect)
  const profileState = useAppSelector(selectUserProfile)
  const categoryState = useAppSelector(selectCategory)
  const selectAllContext = useSelectAll()
  const { userAddress } = useUserContext()

  // Get the selected tab based on page type
  const selectedTab = pageType === 'category' ? categoryState.selectedTab : profileState.selectedTab

  const namesExtend = selectedDomains.filter(
    (domain) =>
      domain.expiry_date && new Date(domain.expiry_date).getTime() + 90 * DAY_IN_SECONDS * 1000 > new Date().getTime()
  )
  const namesList = userAddress
    ? selectedDomains.filter((domain) => domain.owner?.toLowerCase() === userAddress.toLowerCase())
    : []
  const namesTransfer = userAddress
    ? selectedDomains.filter((domain) => domain.owner?.toLowerCase() === userAddress.toLowerCase())
    : []
  const namesCancel = userAddress
    ? selectedDomains.filter(
        (domain) =>
          domain.owner?.toLowerCase() === userAddress.toLowerCase() &&
          domain.listings?.some(
            (listing) =>
              listing.order_data.protocol_data.parameters.consideration[0].identifierOrCriteria === domain.token_id
          )
      )
    : []

  const handleBulkSelect = () => {
    dispatch(setBulkSelectIsSelecting(true))
  }

  const handleCancelBulkSelect = () => {
    dispatch(setBulkSelectIsSelecting(false))
    dispatch(clearBulkSelect())
  }

  const handleListAction = () => {
    dispatch(setMakeListingModalDomains(namesList))
    dispatch(setMakeListingModalPreviousListings(previousListings))
    dispatch(setMakeListingModalOpen(true))
  }

  const handleExtendAction = () => {
    dispatch(setBulkRenewalModalDomains(namesExtend))
    dispatch(setBulkRenewalModalOpen(true))
  }

  const handleTransferAction = () => {
    const transferDomains = namesTransfer.map((domain) => ({
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
      const domain = namesCancel.find((d) => d.listings?.some((l) => l.id === listing.id))

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

  const handleSelectAll = () => {
    if (selectAllContext?.canSelectAll) {
      selectAllContext.startSelectAll()
    }
  }

  const handleCancelSelectAll = () => {
    if (selectAllContext) {
      selectAllContext.cancelSelectAll()
    }
  }

  const handleDismissError = () => {
    dispatch(clearSelectAllError())
  }

  // For profile tabs
  const isProfileTab = pageType === 'profile'
  // const isCategoryTab = pageType === 'category'

  // Define which tabs support bulk select for each page type
  const profileBulkSelectTabs = ['domains', 'listings', 'grace']
  const categoryBulkSelectTabs = ['names', 'premium', 'available']

  const isBulkSelectSupportedTab = isProfileTab
    ? profileBulkSelectTabs.includes(selectedTab?.value || '')
    : categoryBulkSelectTabs.includes(selectedTab?.value || '')

  const canListDomains =
    selectedTab?.value === 'domains' || selectedTab?.value === 'listings' || selectedTab?.value === 'names'
  const canExtendDomains =
    selectedTab?.value === 'domains' ||
    selectedTab?.value === 'listings' ||
    selectedTab?.value === 'grace' ||
    selectedTab?.value === 'names'
  const canTransferDomains =
    selectedTab?.value === 'domains' ||
    selectedTab?.value === 'listings' ||
    selectedTab?.value === 'grace' ||
    selectedTab?.value === 'names'
  const canCancelListings = selectedTab?.value === 'domains' || selectedTab?.value === 'listings'

  const isSelectAllLoading = selectAll?.isLoading ?? false
  const selectAllProgress = selectAll?.progress
  const selectAllError = selectAll?.error

  if (!isBulkSelectSupportedTab) return null

  return (
    <div className='bulk-select-container fixed right-1 bottom-1 flex max-w-[calc(100%-8px)] flex-col items-end justify-end gap-1.5 bg-transparent px-1 sm:right-2 sm:bottom-2 sm:flex-row-reverse sm:gap-2 md:right-4 md:bottom-4'>
      {isSelecting ? (
        <>
          {/* Error message banner */}
          {selectAllError && (
            <div className='shadow-bulk flex w-full flex-row items-center justify-between gap-2 rounded-md bg-yellow-900/90 p-2 text-yellow-100 sm:p-3'>
              <p className='text-sm'>{selectAllError}</p>
              <button onClick={handleDismissError} className='text-yellow-100 hover:text-white'>
                <Cross className='h-3 w-3' />
              </button>
            </div>
          )}

          {isSelectAllLoading && selectAllProgress && (
            <div className='shadow-bulk bg-background flex flex-row items-center gap-3 rounded-md p-2 sm:p-3'>
              <div className='flex items-center gap-2'>
                <div className='h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white' />
                <p className='text-lg text-nowrap'>
                  Loading names... {selectAllProgress.loaded}/{selectAllProgress.total}
                </p>
              </div>
              <SecondaryButton onClick={handleCancelSelectAll} className='h-9 md:h-10'>
                Cancel
              </SecondaryButton>
            </div>
          )}

          {/* Normal selecting state - not loading */}
          {!isSelectAllLoading && (
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
                <div className='flex flex-row gap-1.5 p-2 sm:p-3'>
                  <PrimaryButton
                    onClick={handleExtendAction}
                    disabled={selectedDomains.length === 0 || !canExtendDomains || namesExtend.length === 0}
                  >
                    <p className='text-nowrap'>({namesExtend.length}) Extend</p>
                  </PrimaryButton>
                  <PrimaryButton
                    onClick={handleTransferAction}
                    disabled={selectedDomains.length === 0 || !canTransferDomains || namesTransfer.length === 0}
                  >
                    <p className='text-nowrap'>({namesTransfer.length}) Transfer</p>
                  </PrimaryButton>
                  <PrimaryButton
                    onClick={handleListAction}
                    disabled={selectedDomains.length === 0 || !canListDomains || namesList.length === 0}
                  >
                    <p className='text-nowrap'>({namesList.length}) List</p>
                  </PrimaryButton>
                  <PrimaryButton
                    onClick={handleCancelListingsAction}
                    disabled={previousListings.length === 0 || !canCancelListings || namesCancel.length === 0}
                  >
                    <p className='text-nowrap'>({namesCancel.length}) Cancel Listings</p>
                  </PrimaryButton>
                </div>
                <div className='bg-background border-tertiary hidden flex-row gap-1.5 border-l-2 p-3 pl-1.5 sm:flex'>
                  <SecondaryButton className='hover:bg-background-hover flex h-9 min-w-9 cursor-auto items-center justify-center bg-transparent p-0! text-2xl text-nowrap md:h-10 md:min-w-10'>
                    {selectedDomains.length}
                  </SecondaryButton>
                  {selectAllContext?.canSelectAll && (
                    <SecondaryButton onClick={handleSelectAll}>Select All</SecondaryButton>
                  )}
                  <SecondaryButton
                    onClick={handleCancelBulkSelect}
                    className='hidden w-28 items-center justify-center sm:flex'
                  >
                    Close
                  </SecondaryButton>
                </div>
              </div>
            </>
          )}
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
