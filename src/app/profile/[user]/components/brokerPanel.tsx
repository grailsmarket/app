'use client'

import React, { useState } from 'react'
import { Address } from 'viem'
import Domains from '@/components/domains'
import ViewSelector from '@/components/domains/viewSelector'
import { useBrokeredListings } from '../hooks/useBrokeredListings'
import { PORTFOLIO_BROKER_DISPLAYED_COLUMNS } from '@/constants/domains/marketplaceDomains'
import { cn } from '@/utils/tailwind'
import { useNavbar } from '@/context/navbar'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { ShortArrow } from 'ethereum-identity-kit'
import { useClickAway } from '@/hooks/useClickAway'

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
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false)
  const { isNavbarVisible } = useNavbar()
  const { selectors } = useFilterRouter()
  const dropdownRef = useClickAway(() => setIsStatusFilterOpen(false))

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
        <div className='px-sm flex w-full items-center gap-3 sm:w-fit md:p-0'>
          <div ref={dropdownRef as React.RefObject<HTMLDivElement>} className='relative w-[180px]'>
            {/* <Dropdown
              label='Status'
              options={STATUS_OPTIONS}
              value={statusFilter}
              onSelect={(value) => setStatusFilter(value as string)}
              placeholder='Filter by status'
              className='bg-transparent h-10 py-1'
              hideLabel
            /> */}
            <button
              className='border-tertiary hover:border-foreground/50 flex h-9 w-full cursor-pointer items-center justify-between gap-1.5 rounded-sm border-[2px] bg-transparent px-3 transition-all sm:h-10'
              onClick={() => setIsStatusFilterOpen(!isStatusFilterOpen)}
            >
              <p className='text-md font-medium whitespace-nowrap sm:text-lg'>
                {STATUS_OPTIONS.find((option) => option.value === statusFilter)?.label || 'All Statuses'}
              </p>
              <ShortArrow
                className={cn('h-3 w-3 transition-transform', isStatusFilterOpen ? 'rotate-0' : 'rotate-180')}
              />
            </button>
            <div
              className={cn(
                'bg-background border-tertiary absolute top-12 left-0 w-full flex-col rounded-md border-2 shadow-lg',
                isStatusFilterOpen ? 'flex' : 'hidden'
              )}
            >
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  className='hover:bg-secondary text-md h-10 w-full cursor-pointer bg-transparent px-3 text-left font-medium whitespace-nowrap sm:text-lg'
                  onClick={() => {
                    setStatusFilter(option.value)
                    setIsStatusFilterOpen(false)
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <p className='text-neutral text-lg font-semibold'>
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
        displayedDetails={PORTFOLIO_BROKER_DISPLAYED_COLUMNS}
        showWatchlist={false}
        isBulkSelecting={false}
      />
    </div>
  )
}

export default BrokerPanel
