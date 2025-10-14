'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchMarketplaceDomains } from '@/api/domains/fetchMarketplaceDomains'
import DomainsTable from '@/components/domains/table'
import { useAppSelector } from '@/state/hooks'
import { selectMarketplaceFilters } from '@/state/reducers/filters/marketplaceFilters'

const RecentListings = () => {
  const filters = useAppSelector(selectMarketplaceFilters)
  console.log('filters', filters)
  const { data: listings, isLoading } = useQuery({
    queryKey: ['recentListings'],
    queryFn: () =>
      fetchMarketplaceDomains({
        limit: 7,
        pageParam: 0,
        filters,
        searchTerm: '',
      }),
  })

  return (
    <div className='flex flex-col gap-4'>
      <h2 className='px-lg text-2xl font-bold'>Recent Listings</h2>
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

export default RecentListings
