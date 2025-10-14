'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchMarketplaceDomains } from '@/api/domains/fetchMarketplaceDomains'
import DomainsTable from '@/components/domains/table'
import { selectMarketplaceFilters } from '@/state/reducers/filters/marketplaceFilters'
import { useAppSelector } from '@/state/hooks'

const SalesAndRegs = () => {
  const filters = useAppSelector(selectMarketplaceFilters)
  const { data: listings, isLoading } = useQuery({
    queryKey: ['recentListings'],
    queryFn: () =>
      fetchMarketplaceDomains({
        limit: 7,
        pageParam: 0,
        filters,
        searchTerm: 'hey',
      }),
  })

  return (
    <div className='flex flex-col gap-4'>
      <h2 className='px-lg text-2xl font-bold'>Recent Sales & Registrations</h2>
      <DomainsTable
        domains={listings?.domains || []}
        loadingRowCount={7}
        isLoading={isLoading}
        noResults={!isLoading && listings?.domains?.length === 0}
        listScrollTop={0}
        showHeaders={false}
        displayedDetails={['listed_price']}
      />
    </div>
  )
}

export default SalesAndRegs
