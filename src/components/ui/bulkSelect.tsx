import React, { useCallback, useEffect, useState } from 'react'
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
  removeBulkSelectWatchlistId,
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
import useCartDomains from '@/hooks/useCartDomains'
import { cn } from '@/utils/tailwind'
import { useShiftKeyListener } from '@/hooks/useShiftKey'
import { removeFromWatchlist } from '@/api/watchlist/removeFromWatchlist'
import { useQueryClient } from '@tanstack/react-query'
import { selectWatchlistFilters } from '@/state/reducers/filters/watchlistFilters'
import Label from './label'

interface BulkSelectProps {
  isMyProfile?: boolean
  pageType?: 'profile' | 'category'
}

const BulkSelect: React.FC<BulkSelectProps> = ({ isMyProfile = false, pageType = 'profile' }) => {
  const [isRemovingFromWatchlist, setIsRemovingFromWatchlist] = useState(false)
  // Delayed state for content switch - keeps expanded content visible during close animation
  const [showExpandedContent, setShowExpandedContent] = useState(false)

  const dispatch = useAppDispatch()
  const {
    isSelecting,
    domains: selectedDomains,
    previousListings,
    selectAll,
    watchlistIds: selectedWatchlistIds,
  } = useAppSelector(selectBulkSelect)

  // Handle delayed content switch for smooth close animation
  useEffect(() => {
    if (isSelecting) {
      // When opening, show expanded content immediately
      setShowExpandedContent(true)
    } else {
      // When closing, delay hiding expanded content until after transition completes
      const timeout = setTimeout(() => {
        setShowExpandedContent(false)
      }, 300) // match transition duration
      return () => clearTimeout(timeout)
    }
  }, [isSelecting])

  // Listen for shift key events and update Redux state
  useShiftKeyListener()
  const profileState = useAppSelector(selectUserProfile)
  const categoryState = useAppSelector(selectCategory)
  const selectAllContext = useSelectAll()
  const { userAddress } = useUserContext()
  const { cartIsEmpty } = useCartDomains()
  const queryClient = useQueryClient()
  const watchlistFilters = useAppSelector(selectWatchlistFilters)

  // Get the selected tab based on page type
  const categoryTab = categoryState.selectedTab
  const profileTab = profileState.selectedTab
  const selectedTab = pageType === 'category' ? categoryTab : profileTab

  useEffect(() => {
    dispatch(setBulkSelectIsSelecting(false))
    dispatch(clearBulkSelect())
  }, [selectedTab, dispatch])

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
            (listing) => listing.order_data.protocol_data.parameters.offer[0].identifierOrCriteria === domain.token_id
          )
      )
    : []

  const handleBulkSelect = () => {
    dispatch(setBulkSelectIsSelecting(true))
  }

  const handleCancelBulkSelect = useCallback(() => {
    dispatch(setBulkSelectIsSelecting(false))
    dispatch(clearBulkSelect())
  }, [dispatch])

  // Keyboard shortcuts: SHIFT+A for select all, Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input field
      const activeElement = document.activeElement
      const isInputField =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement?.getAttribute('contenteditable') === 'true'

      if (isInputField) return

      // SHIFT + A: Select all (only when bulk select is active)
      if (e.shiftKey && e.key.toLowerCase() === 'a' && isSelecting) {
        e.preventDefault()
        if (selectAllContext?.canSelectAll) {
          selectAllContext.startSelectAll()
        }
        return
      }

      // Escape: Close bulk select (only when bulk select is active)
      if (e.key === 'Escape' && isSelecting) {
        e.preventDefault()
        handleCancelBulkSelect()
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSelecting, selectAllContext, handleCancelBulkSelect])

  const handleListAction = () => {
    dispatch(setMakeListingModalDomains(namesList))
    dispatch(setMakeListingModalPreviousListings(previousListings))
    dispatch(setMakeListingModalOpen(true))
  }

  const handleExtendAction = () => {
    dispatch(setBulkRenewalModalDomains(namesExtend))
    dispatch(setBulkRenewalModalOpen(true))
  }

  const handleRemoveFromWatchlistAction = async () => {
    setIsRemovingFromWatchlist(true)

    const results = await Promise.all(
      selectedWatchlistIds.map(async (id) => {
        const result = await removeFromWatchlist(id)
        if (result.success) {
          dispatch(removeBulkSelectWatchlistId(id))
        }
        return result
      })
    )

    if (results.some((result) => !result.success)) {
      console.error(
        'Failed to remove from watchlist' +
          results
            .filter((result) => !result.success)
            .map((result) => result.watchlistId)
            .join(', ')
      )
    } else {
      dispatch(clearBulkSelect())
    }

    queryClient.setQueryData(
      [
        'profile',
        'watchlist',
        userAddress,
        watchlistFilters.search,
        watchlistFilters.length,
        watchlistFilters.priceRange,
        watchlistFilters.categories,
        watchlistFilters.type,
        watchlistFilters.status,
        watchlistFilters.sort,
        watchlistFilters.textMatch,
        watchlistFilters.market,
      ],
      (old: any) => {
        const newData = old.pages.map((page: any) => {
          return {
            ...page,
            domains: page.domains.filter((item: any) => !selectedWatchlistIds.includes(item.watchlist_id)),
          }
        })

        return {
          ...old,
          pages: newData,
        }
      }
    )

    setIsRemovingFromWatchlist(false)
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
  const isCategoryTab = pageType === 'category'
  const isActionButtonsVisible =
    (isCategoryTab ? selectedTab?.value === 'names' : selectedTab?.value === 'watchlist') && !cartIsEmpty

  // Define which tabs support bulk select for each page type
  const profileBulkSelectTabs = ['domains', 'listings', 'grace', 'watchlist']
  const categoryBulkSelectTabs = ['names', 'premium', 'available']

  const isBulkSelectSupportedTab = isProfileTab
    ? profileBulkSelectTabs.includes(selectedTab?.value || '')
    : categoryBulkSelectTabs.includes(selectedTab?.value || '')

  const showOwnedActionButtons = isCategoryTab
    ? selectedTab?.value === 'names'
    : isMyProfile
      ? selectedTab?.value === 'domains' || selectedTab?.value === 'listings' || selectedTab?.value === 'names'
      : selectedTab?.value === 'watchlist'
  const showWatchlistButton = isProfileTab && isMyProfile && selectedTab?.value === 'watchlist'

  const canListDomains =
    selectedTab?.value === 'domains' || selectedTab?.value === 'listings' || selectedTab?.value === 'names'
  const canExtendDomains =
    selectedTab?.value === 'domains' ||
    selectedTab?.value === 'listings' ||
    selectedTab?.value === 'grace' ||
    selectedTab?.value === 'names' ||
    selectedTab?.value === 'watchlist'
  const canTransferDomains =
    selectedTab?.value === 'domains' ||
    selectedTab?.value === 'listings' ||
    selectedTab?.value === 'grace' ||
    selectedTab?.value === 'names'
  const canCancelListings = selectedTab?.value === 'domains' || selectedTab?.value === 'listings'

  const isSelectAllLoading = selectAll?.isLoading ?? false
  const selectAllProgress = selectAll?.progress
  const selectAllError = selectAll?.error

  const bulkSelectWidth = showOwnedActionButtons
    ? 'min(820px,95vw)'
    : showWatchlistButton
      ? 'min(650px,95vw)'
      : 'min(420px,95vw)'

  if (!isBulkSelectSupportedTab) return null

  return (
    <div
      className={cn(
        'bulk-select-container fixed flex max-w-[calc(100%-8px)] flex-col items-end justify-end gap-1.5 bg-transparent px-1 transition-all sm:right-2 sm:bottom-2 sm:gap-1.5',
        isActionButtonsVisible ? 'right-1 bottom-15 md:right-4 md:bottom-18' : 'right-1 bottom-1 md:right-4 md:bottom-4'
      )}
    >
      {isSelecting && selectAllError && (
        <div className='shadow-bulk flex w-full flex-row items-center justify-between gap-2 rounded-md bg-yellow-900/90 p-2 text-yellow-100 sm:p-3'>
          <p className='text-sm'>{selectAllError}</p>
          <button onClick={handleDismissError} className='text-yellow-100 hover:text-white'>
            <Cross className='h-3 w-3' />
          </button>
        </div>
      )}

      {isSelecting && isSelectAllLoading && selectAllProgress && (
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

      {isSelecting && !isSelectAllLoading && (
        <div className='bg-background shadow-bulk hidden flex-row gap-1.5 rounded-md p-2 lg:flex'>
          <p className='text-md text-neutral text-end font-semibold'>Hold ⇧SHIFT to select range</p>
          <div className='bg-neutral h-4 w-px' />
          <p className='text-md text-neutral text-end font-semibold'>⇧SHIFT + A to Select All</p>
          <div className='bg-neutral h-4 w-px' />
          <p className='text-md text-neutral text-end font-semibold'>ESC to Close</p>
        </div>
      )}

      {isSelecting && !isSelectAllLoading && (
        <div className='bg-background shadow-bulk flex flex-row gap-1.5 rounded-md p-2 sm:hidden'>
          <SecondaryButton className='hover:bg-background-hover flex h-9 min-w-9 cursor-auto items-center justify-center bg-transparent p-0! text-2xl text-nowrap md:h-10 md:min-w-10'>
            {selectedDomains.length}
          </SecondaryButton>
          {pageType === 'profile' && (
            <SecondaryButton onClick={handleSelectAll} disabled={!selectAllContext?.canSelectAll}>
              Select All
            </SecondaryButton>
          )}
          <SecondaryButton
            onClick={handleCancelBulkSelect}
            className='flex w-9 min-w-9 items-center justify-center p-0! md:w-10'
          >
            <Cross className='h-3 w-3' />
          </SecondaryButton>
        </div>
      )}

      <div
        className={cn(
          'shadow-bulk bg-background overflow-hidden rounded-md transition-[width] duration-200'
          // isSelecting ? bulkSelectWidth : 'w-34'
        )}
        style={{
          width: isSelecting ? bulkSelectWidth : '136px',
          // transitionTimingFunction: 'cubic-bezier(.8,.95,.44,.02)'
        }}
      >
        {showExpandedContent ? (
          <div
            className={cn(
              'flex max-w-full flex-row overflow-x-scroll transition-opacity duration-300',
              isSelecting ? 'opacity-100' : 'opacity-0'
            )}
          >
            <div className='flex flex-row gap-1.5 p-2 sm:p-3'>
              {showWatchlistButton && (
                <PrimaryButton
                  className='flex items-center gap-2'
                  onClick={handleRemoveFromWatchlistAction}
                  disabled={selectedWatchlistIds.length === 0}
                >
                  {isRemovingFromWatchlist ? (
                    <div className='h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black' />
                  ) : null}
                  <p>Remove&nbsp;from&nbsp;Watchlist</p>
                  <Label label={selectedWatchlistIds.length} className='bg-tertiary w-7 min-w-fit text-white' />
                </PrimaryButton>
              )}
              <PrimaryButton
                onClick={handleExtendAction}
                disabled={selectedDomains.length === 0 || !canExtendDomains || namesExtend.length === 0}
                className='flex items-center gap-1.5'
              >
                <p>Extend</p>
                <Label label={namesExtend.length} className='bg-tertiary w-7 min-w-fit text-white' />
              </PrimaryButton>
              {showOwnedActionButtons && (
                <>
                  <PrimaryButton
                    onClick={handleTransferAction}
                    disabled={selectedDomains.length === 0 || !canTransferDomains || namesTransfer.length === 0}
                    className='flex items-center gap-1.5'
                  >
                    <p>Transfer</p>
                    <Label label={namesTransfer.length} className='bg-tertiary w-7 min-w-fit text-white' />
                  </PrimaryButton>
                  <PrimaryButton
                    onClick={handleListAction}
                    disabled={selectedDomains.length === 0 || !canListDomains || namesList.length === 0}
                    className='flex items-center gap-1.5'
                  >
                    <p>List</p>
                    <Label label={namesList.length} className='bg-tertiary w-7 min-w-fit text-white' />
                  </PrimaryButton>
                  <PrimaryButton
                    onClick={handleCancelListingsAction}
                    disabled={previousListings.length === 0 || !canCancelListings || namesCancel.length === 0}
                    className='flex items-center gap-1.5'
                  >
                    <p>Cancel&nbsp;Listings</p>
                    <Label label={namesCancel.length} className='bg-tertiary w-7 min-w-fit text-white' />
                  </PrimaryButton>
                </>
              )}
            </div>
            <div className='bg-background border-tertiary hidden flex-col gap-1 border-l-2 p-3 pl-1.5 sm:flex'>
              <div className='flex flex-row gap-1.5'>
                <SecondaryButton className='hover:bg-background-hover flex h-9 min-w-9 cursor-auto items-center justify-center bg-transparent p-0! text-2xl text-nowrap md:h-10 md:min-w-10'>
                  {selectedDomains.length}
                </SecondaryButton>
                {pageType === 'profile' && (
                  <SecondaryButton
                    className='hidden sm:block'
                    onClick={handleSelectAll}
                    disabled={!selectAllContext?.canSelectAll}
                  >
                    Select&nbsp;All
                  </SecondaryButton>
                )}
                <SecondaryButton
                  onClick={handleCancelBulkSelect}
                  className='hidden w-28 items-center justify-center sm:flex'
                >
                  Close
                </SecondaryButton>
              </div>
            </div>
          </div>
        ) : (
          <div className='p-2 sm:p-3'>
            <PrimaryButton onClick={handleBulkSelect} className='w-28'>
              Bulk&nbsp;Select
            </PrimaryButton>
          </div>
        )}
      </div>
    </div>
  )
}

export default BulkSelect
