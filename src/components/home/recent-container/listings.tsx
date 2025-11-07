'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchDomains } from '@/api/domains/fetchDomains'
import Domains from '@/components/domains'
import { useAppSelector } from '@/state/hooks'
import { selectMarketplaceFilters } from '@/state/reducers/filters/marketplaceFilters'

const RecentListings = () => {
  const filters = useAppSelector(selectMarketplaceFilters)

  const { data: listings, isLoading } = useQuery({
    queryKey: ['recentListings'],
    queryFn: () =>
      fetchDomains({
        limit: 7,
        pageParam: 1,
        filters: {
          ...filters,
          sort: 'price_desc',
        },
      }),
  })

  return (
    <div className='flex flex-col gap-4'>
      <h2 className='md:px-md lg:px-lg text-2xl font-bold'>Recent Listings</h2>
      <Domains
        domains={listings?.domains || []}
        loadingRowCount={7}
        maxHeight='420px'
        paddingBottom='0px'
        isLoading={isLoading}
        noResults={!isLoading && listings?.domains?.length === 0}
        showHeaders={false}
        displayedDetails={['listed_price']}
        forceViewType='list'
      />
    </div>
  )
}

export default RecentListings
