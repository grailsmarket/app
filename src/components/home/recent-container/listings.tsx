'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchDomains } from '@/api/domains/fetchDomains'
import { emptyFilterState } from '@/state/reducers/filters/marketplaceFilters'
import TableRow from '@/components/domains/table/components/TableRow'
import TableLoadingRow from '@/components/domains/table/components/TableLoadingRow'
import { useUserContext } from '@/context/user'

const RecentListings = () => {
  const { authStatus } = useUserContext()
  const { data: listings, isLoading } = useQuery({
    queryKey: ['recentListings'],
    queryFn: () =>
      fetchDomains({
        limit: 7,
        pageParam: 1,
        filters: {
          ...emptyFilterState,
          market: {
            ...emptyFilterState.market,
            Listed: 'yes',
          },
          status: ['Registered'],
        },
        inAnyCategory: true,
        searchTerm: '',
        isAuthenticated: authStatus === 'authenticated',
      }),
  })

  return (
    <div className='flex flex-col'>
      <h2 className='p-md lg:p-lg text-2xl font-bold'>Recent Listings</h2>
      <div className='border-tertiary flex flex-col gap-0 border-t'>
        {isLoading
          ? new Array(7).fill(null).map((_, index) => (
              <div key={index} className='px-lg border-tertiary flex h-[60px] w-full items-center border-b'>
                <TableLoadingRow displayedColumns={['domain', 'price', 'actions']} />
              </div>
            ))
          : listings?.domains?.map((domain, index) => (
              <div key={domain.token_id}>
                <TableRow domain={domain} index={index} displayedColumns={['domain', 'price', 'actions']} />
              </div>
            ))}
      </div>
    </div>
  )
}

export default RecentListings
