'use client'

import React, { useState } from 'react'
import { Address } from 'viem'
import Domains from '@/components/domains'
import ViewSelector from '@/components/domains/viewSelector'
import Dropdown from '@/components/ui/dropdown'
import { useBrokeredListings } from '../hooks/useBrokeredListings'
import { PORTFOLIO_MY_LISTINGS_DISPLAYED_COLUMNS } from '@/constants/domains/marketplaceDomains'
import { cn } from '@/utils/tailwind'
import { useNavbar } from '@/context/navbar'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'

interface Props {
  user: Address | undefined
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'sold', label: 'Sold' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'expired', label: 'Expired' },
]

const BrokerPanel: React.FC<Props> = ({ user }) => {
  const [statusFilter, setStatusFilter] = useState<string>('')
  const { isNavbarVisible } = useNavbar()
  const { selectors } = useFilterRouter()

  const {
    brokeredListings,
    brokeredListingsLoading,
    fetchMoreBrokeredListings,
    hasMoreBrokeredListings,
    totalBrokeredListings,
  } = useBrokeredListings(user, {
    status: statusFilter as 'active' | 'sold' | 'cancelled' | 'expired' | undefined,
  })

  return (
    <div className='z-0 flex w-full flex-col'>
      <div
        className={cn(
          'py-md md:py-lg px-sm md:px-md lg:px-lg transition-top bg-background sticky z-50 flex w-full flex-col items-center justify-between gap-2 duration-300 sm:flex-row',
          isNavbarVisible ? 'top-26 md:top-32' : 'top-12 md:top-14'
        )}
      >
        <div className='px-sm flex w-full items-center gap-2 sm:w-fit md:p-0'>
          <div className='w-[180px]'>
            <Dropdown
              label='Status'
              options={STATUS_OPTIONS}
              value={statusFilter}
              onSelect={(value) => setStatusFilter(value as string)}
              placeholder='Filter by status'
              hideLabel
            />
          </div>
          <p className='text-neutral text-sm'>
            {totalBrokeredListings} {totalBrokeredListings === 1 ? 'listing' : 'listings'}
          </p>
        </div>
        <div className='px-sm flex w-full items-center justify-end gap-2 sm:w-fit'>
          <ViewSelector />
        </div>
      </div>
      <Domains
        domains={brokeredListings}
        loadingRowCount={20}
        filtersOpen={selectors.filters.open}
        paddingBottom='160px'
        noResults={!brokeredListingsLoading && brokeredListings.length === 0}
        isLoading={brokeredListingsLoading}
        hasMoreDomains={hasMoreBrokeredListings}
        fetchMoreDomains={() => {
          if (hasMoreBrokeredListings && !brokeredListingsLoading) {
            fetchMoreBrokeredListings()
          }
        }}
        displayedDetails={PORTFOLIO_MY_LISTINGS_DISPLAYED_COLUMNS}
        showWatchlist={false}
        isBulkSelecting={false}
      />
    </div>
  )
}

export default BrokerPanel
