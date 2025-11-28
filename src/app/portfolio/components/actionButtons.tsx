'use client'

import { useFilterButtons } from '@/components/filters/hooks/useFilterButtons'
import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'
import { useUserContext } from '@/context/user'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import useCartDomains from '@/hooks/useCartDomains'
import { persistor } from '@/state'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import {
  selectBulkRenewalModal,
  setBulkRenewalModalCanAddDomains,
  setBulkRenewalModalDomains,
  setBulkRenewalModalOpen,
} from '@/state/reducers/modals/bulkRenewalModal'
import {
  selectTransferModal,
  setTransferModalCanAddDomains,
  setTransferModalDomains,
  setTransferModalOpen,
} from '@/state/reducers/modals/transferModal'
import { selectUserProfile } from '@/state/reducers/portfolio/profile'
import { cn } from '@/utils/tailwind'
import React from 'react'
import { PersistGate } from 'redux-persist/integration/react'

const ActionButtons = () => {
  const dispatch = useAppDispatch()
  const { cartIsEmpty, clearCart } = useCartDomains()
  const { setIsCartOpen } = useUserContext()
  const { clearFilters, isFiltersClear, closeFilters } = useFilterButtons()
  const { selectedTab } = useAppSelector(selectUserProfile)
  const { canAddDomains, domains: domainsToRenew } = useAppSelector(selectBulkRenewalModal)
  const { canAddDomains: canTransferDomains, domains: domainsToTransfer } = useAppSelector(selectTransferModal)
  const { selectors } = useFilterRouter()
  const filtersOpen = selectors.filters.open

  return (
    <div
      className={cn(
        'border-tertiary bg-background p-md md:p-lg absolute right-0 bottom-0 z-20 flex w-full flex-row justify-end rounded-b-lg border-t-2 transition-transform duration-300 lg:justify-between starting:translate-y-full',
        selectedTab.value === 'domains' || (selectedTab.value === 'watchlist' && !cartIsEmpty) || filtersOpen
          ? 'translate-y-0'
          : 'translate-y-full'
      )}
    >
      <div className={cn('flex-row justify-end gap-2 lg:w-[262px]', filtersOpen ? 'flex' : 'hidden lg:flex')}>
        <PersistGate persistor={persistor}>
          <SecondaryButton disabled={isFiltersClear} onClick={clearFilters}>
            Clear Filters
          </SecondaryButton>
          <SecondaryButton onClick={closeFilters} className='md:hidden'>
            Close Filters
          </SecondaryButton>
        </PersistGate>
      </div>
      <div className={cn('flex w-fit flex-row gap-x-2', filtersOpen ? 'hidden lg:flex' : 'flex')}>
        {selectedTab.value === 'domains' && canAddDomains && (
          <PrimaryButton
            onClick={() => dispatch(setBulkRenewalModalOpen(true))}
            disabled={domainsToRenew?.length === 0}
          >
            Extend
          </PrimaryButton>
        )}
        {selectedTab.value === 'domains' && canTransferDomains && (
          <PrimaryButton
            onClick={() => dispatch(setTransferModalOpen(true))}
            disabled={domainsToTransfer?.length === 0}
          >
            Transfer
          </PrimaryButton>
        )}
        {selectedTab.value === 'domains' && !canTransferDomains && (
          <SecondaryButton
            onClick={() => {
              if (canAddDomains) {
                dispatch(setBulkRenewalModalDomains([]))
                dispatch(setBulkRenewalModalCanAddDomains(false))
                return
              }

              dispatch(setBulkRenewalModalCanAddDomains(true))
            }}
          >
            {canAddDomains ? 'Cancel' : 'Bulk Extend'}
          </SecondaryButton>
        )}
        {selectedTab.value === 'domains' && !canAddDomains && (
          <SecondaryButton
            onClick={() => {
              if (canTransferDomains) {
                dispatch(setTransferModalDomains([]))
                dispatch(setTransferModalCanAddDomains(false))
                return
              }

              dispatch(setTransferModalCanAddDomains(true))
            }}
          >
            {canTransferDomains ? 'Cancel' : 'Bulk Transfer'}
          </SecondaryButton>
        )}
        {selectedTab.value === 'watchlist' && (
          <>
            <SecondaryButton onClick={() => clearCart()}>ClearCart</SecondaryButton>
            <PrimaryButton onClick={() => setIsCartOpen(true)}>Open Cart</PrimaryButton>
          </>
        )}
      </div>
    </div>
  )
}

export default ActionButtons
