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
    queryKey: ['recentSalesAndRegs'],
    queryFn: () =>
      fetchDomains({
        limit: 7,
        pageParam: 1,
        filters: {
          ...filters,
          sort: 'last_sale_date_desc',
        },
        searchTerm: '',
      }),
  })

  return (
    <div className='flex flex-col gap-4'>
      <h2 className='md:px-md lg:px-lg text-2xl font-bold'>Recent Sales & Registrations</h2>
      <Domains
        domains={listings?.domains || []}
        loadingRowCount={7}
        maxHeight='420px'
        paddingBottom='0px'
        isLoading={isLoading}
        noResults={!isLoading && listings?.domains?.length === 0}
        showHeaders={false}
        displayedDetails={['last_sale']}
        forceViewType='list'
      />
    </div>
  )
}

export default SalesAndRegs
