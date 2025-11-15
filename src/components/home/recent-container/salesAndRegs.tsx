'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchDomains } from '@/api/domains/fetchDomains'
import { emptyFilterState } from '@/state/reducers/filters/marketplaceFilters'
import TableRow from '@/components/domains/table/components/TableRow'
import TableLoadingRow from '@/components/domains/table/components/TableLoadingRow'

const SalesAndRegs = () => {
  const { data: listings, isLoading } = useQuery({
    queryKey: ['recentSalesAndRegs'],
    queryFn: () =>
      fetchDomains({
        limit: 7,
        pageParam: 1,
        filters: {
          ...emptyFilterState,
          sort: 'last_sale_date_desc',
        },
        searchTerm: '',
      }),
  })

  return (
    <div className='flex flex-col'>
      <h2 className='p-sm md:p-md lg:p-lg text-2xl font-bold'>Recent Sales</h2>
      <div className='flex flex-col gap-0'>
        {isLoading
          ? new Array(7).fill(null).map((_, index) => (
            <div key={index} className='md:px-md flex h-[60px] w-full items-center'>
              <TableLoadingRow displayedColumns={['domain', 'last_sale', 'actions']} />
            </div>
          ))
          : listings?.domains?.map((domain, index) => (
            <div key={domain.token_id}>
              <TableRow domain={domain} index={index} displayedColumns={['domain', 'last_sale', 'actions']} />
            </div>
          ))}
      </div>
    </div>
  )
}

export default SalesAndRegs
