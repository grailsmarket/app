'use client'

import { useFilterButtons } from '@/components/filters/hooks/useFilterButtons'
import SecondaryButton from '@/components/ui/buttons/secondary'
import { persistor } from '@/state'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { selectMarketplaceFilters } from '@/state/reducers/filters/marketplaceFilters'
import {
  selectBulkRenewalModal,
  setBulkRenewalModalCanAddDomains,
  setBulkRenewalModalOpen,
} from '@/state/reducers/modals/bulkRenewalModal'
import { selectUserProfile } from '@/state/reducers/portfolio/profile'
import { cn } from '@/utils/tailwind'
import React from 'react'
import { PersistGate } from 'redux-persist/integration/react'

const ActionButtons = () => {
  const dispatch = useAppDispatch()
  const { open } = useAppSelector(selectMarketplaceFilters)
  const { clearFilters, isFiltersClear, closeFilters } = useFilterButtons()
  const { selectedTab } = useAppSelector(selectUserProfile)
  const { canAddDomains, domains: domainsToRenew } = useAppSelector(selectBulkRenewalModal)

  return (
    <div className='border-primary bg-background p-lg absolute right-0 bottom-0 z-20 flex w-full flex-row justify-end rounded-b-lg border-t-2 lg:justify-between'>
      <div className={cn('flex-row justify-end gap-2 lg:w-[262px]', open ? 'flex' : 'hidden lg:flex')}>
        <PersistGate persistor={persistor}>
          <SecondaryButton disabled={isFiltersClear} onClick={clearFilters}>
            Clear Filters
          </SecondaryButton>
          <SecondaryButton onClick={closeFilters} className='md:hidden'>
            Close Filters
          </SecondaryButton>
        </PersistGate>
      </div>
      <div className={cn('flex w-fit flex-row gap-x-2', open ? 'hidden lg:flex' : 'flex')}>
        {selectedTab.value === 'domains' && canAddDomains && (
          <SecondaryButton
            onClick={() => dispatch(setBulkRenewalModalOpen(true))}
            disabled={domainsToRenew?.length === 0}
          >
            Open Modal
          </SecondaryButton>
        )}
        {selectedTab.value === 'domains' && (
          <SecondaryButton onClick={() => dispatch(setBulkRenewalModalCanAddDomains(!canAddDomains))}>
            {canAddDomains ? 'Disable Bulk Extend' : 'Bulk Extend'}
          </SecondaryButton>
        )}
      </div>
    </div>
  )
}

export default ActionButtons
