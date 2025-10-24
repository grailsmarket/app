'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchDomains } from '@/api/domains/fetchDomains'
import Domains from '@/components/domains'
import { selectMarketplaceFilters } from '@/state/reducers/filters/marketplaceFilters'
import { useAppSelector } from '@/state/hooks'

const SalesAndRegs = () => {
  const filters = useAppSelector(selectMarketplaceFilters)
  const { data: listings, isLoading } = useQuery({
    queryKey: ['recentListings'],
    queryFn: () =>
      fetchDomains({
        limit: 7,
        pageParam: 0,
        filters,
        searchTerm: 'hey',
      }),
  })

  return (
    <div className='flex flex-col gap-4'>
      <h2 className='md:px-md lg:px-lg text-2xl font-bold'>Recent Sales & Registrations</h2>
      <Domains
        domains={listings?.domains || []}
        loadingRowCount={7}
        isLoading={isLoading}
        noResults={!isLoading && listings?.domains?.length === 0}
        showHeaders={false}
        displayedDetails={['listed_price']}
        forceViewType='list'
      />
    </div>
  )
}

export default SalesAndRegs
