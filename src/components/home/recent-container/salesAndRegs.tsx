'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchMarketplaceDomains } from '@/api/domains/fetchMarketplaceDomains'
import DomainsTable from '@/components/domains/table'

const SalesAndRegs = () => {
  const { data: listings, isLoading } = useQuery({
    queryKey: ['recentListings'],
    queryFn: () => fetchMarketplaceDomains({
      limit: 7,
      pageParam: 0,
      filters: {
        status: ['Listed'],
        type: ['Letters'],
        priceRange: { min: 0, max: 1000000000000000000000000000000000000000 },
        length: { min: '3', max: '10+' },
        denomination: 'ETH',
        categoryObjects: [],
        sort: null,
      },
      searchTerm: '',
    }),
  })

  console.log(listings?.domains)

  return (
    <div className='flex flex-col gap-4'>
      <h2 className='text-2xl font-bold px-lg'>Recent Sales & Registrations</h2>
      <DomainsTable
        domains={listings?.domains || []}
        loadingRowCount={7}
        isLoading={isLoading}
        noResults={!isLoading && listings?.domains?.length === 0}
        listScrollTop={0}
        showHeaders={false}
      />
    </div>
  )
}

export default SalesAndRegs