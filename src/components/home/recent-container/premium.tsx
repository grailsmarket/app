'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchDomains } from '@/api/domains/fetchDomains'
import { emptyFilterState } from '@/state/reducers/filters/marketplaceFilters'
import TableRow from '@/components/domains/table/components/TableRow'
import TableLoadingRow from '@/components/domains/table/components/TableLoadingRow'
import { useUserContext } from '@/context/user'
import { Arrow } from 'ethereum-identity-kit'
import Link from 'next/link'

const Premium = () => {
  const { authStatus } = useUserContext()
  const { data: listings, isLoading } = useQuery({
    queryKey: ['recentSalesAndRegs'],
    queryFn: () =>
      fetchDomains({
        limit: 7,
        pageParam: 1,
        filters: {
          ...emptyFilterState,
          status: ['Premium'],
          sort: 'expiry_date_asc',
          type: {
            Digits: 'exclude',
            Emojis: 'exclude',
            Repeating: 'include',
            Letters: 'include',
          },
        },
        searchTerm: '',
        isAuthenticated: authStatus === 'authenticated',
        inAnyCategory: true,
        excludeCategories: ['prepunks'],
      }),
  })

  return (
    <div className='flex flex-col'>
      <div className='p-md lg:px-lg flex w-full items-center justify-between'>
        <h2 className='font-sedan-sc text-3xl font-medium sm:text-4xl'>In Premium</h2>
        <Link
          href='/marketplace?tab=premium'
          className='text-primary hover:text-primary/80 group flex items-center justify-end gap-2 text-center text-lg font-semibold sm:text-xl'
        >
          <p>View All</p>
          <Arrow className='text-primary h-3 w-3 rotate-180 transition-all duration-300 group-hover:translate-x-1' />
        </Link>
      </div>
      <div className='border-tertiary bg-secondary flex flex-col gap-0 rounded-md border-2 border-t'>
        {isLoading
          ? new Array(7).fill(null).map((_, index) => (
              <div key={index} className='md:px-md border-tertiary flex h-[60px] w-full items-center border-b'>
                <TableLoadingRow displayedColumns={['domain', 'last_sale', 'actions']} />
              </div>
            ))
          : listings?.domains?.map((domain, index) => (
              <div key={domain.token_id}>
                <TableRow
                  domain={domain}
                  index={index}
                  displayedColumns={['domain', 'price', 'actions']}
                  showWatchlist={false}
                  hideCartIcon={true}
                />
              </div>
            ))}
      </div>
    </div>
  )
}

export default Premium
