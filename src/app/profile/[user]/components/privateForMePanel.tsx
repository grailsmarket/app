'use client'

import React from 'react'
import { Address } from 'viem'
import Domains from '@/components/domains'
import ViewSelector from '@/components/domains/viewSelector'
import { usePrivateListings } from '../hooks/usePrivateListings'
import { PORTFOLIO_PRIVATE_FOR_ME_DISPLAYED_COLUMNS } from '@/constants/domains/marketplaceDomains'
import { cn } from '@/utils/tailwind'
import { useNavbar } from '@/context/navbar'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'

interface Props {
  user: Address | undefined
}

const PrivateForMePanel: React.FC<Props> = ({ user }) => {
  const { isNavbarVisible } = useNavbar()
  const { selectors } = useFilterRouter()

  const {
    privateListings,
    isPrivateListingsLoading,
    fetchMorePrivateListings,
    hasMorePrivateListings,
    totalPrivateListings,
  } = usePrivateListings(user)

  return (
    <div className='z-0 flex w-full flex-col'>
      <div
        className={cn(
          'py-md md:py-lg px-sm md:px-md lg:px-lg transition-top bg-background sticky z-50 flex w-full flex-col items-center justify-between gap-2 duration-300 sm:flex-row',
          isNavbarVisible ? 'top-26 md:top-32' : 'top-12 md:top-14'
        )}
      >
        <div className='px-sm flex w-full items-center gap-3 sm:w-fit md:p-0'>
          <p className='text-neutral text-lg font-semibold'>
            {totalPrivateListings} private {totalPrivateListings === 1 ? 'listing' : 'listings'} for you
          </p>
        </div>
        <div className='px-sm flex w-full items-center justify-end gap-2 sm:w-fit'>
          <ViewSelector />
        </div>
      </div>
      <Domains
        domains={privateListings}
        loadingRowCount={20}
        filtersOpen={selectors.filters.open}
        paddingBottom='160px'
        noResults={!isPrivateListingsLoading && privateListings.length === 0}
        isLoading={isPrivateListingsLoading}
        hasMoreDomains={hasMorePrivateListings}
        fetchMoreDomains={() => {
          if (hasMorePrivateListings && !isPrivateListingsLoading) {
            fetchMorePrivateListings()
          }
        }}
        displayedDetails={PORTFOLIO_PRIVATE_FOR_ME_DISPLAYED_COLUMNS}
        showWatchlist={false}
        isBulkSelecting={false}
      />
    </div>
  )
}

export default PrivateForMePanel
