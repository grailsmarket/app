'use client'

import React from 'react'
import Link from 'next/link'
import { Arrow } from 'ethereum-identity-kit'
import { fetchTopSales } from '@/api/analytics'
import { useQuery } from '@tanstack/react-query'
import { SaleRow } from '@/app/analytics/components/AnalyticsRow'
import TableLoadingRow from '@/components/domains/table/components/TableLoadingRow'

const Sales = () => {
  const { data: sales, isLoading } = useQuery({
    queryKey: ['analytics', 'topSales', '7d', 'all', 'any'],
    queryFn: () => fetchTopSales({ period: '7d', source: 'all', category: null }),
  })

  return (
    <div className='flex flex-col'>
      <div className='p-md lg:px-lg flex w-full items-center justify-between'>
        <h2 className='font-sedan-sc text-3xl font-medium sm:text-4xl'>Top Sales</h2>
        <Link
          href='/analytics'
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
          : sales?.data?.results?.slice(0, 7).map((sale, index) => (
              <div key={sale.id} className='w-full'>
                <SaleRow sale={sale} index={index} hideSeller={true} className='h-[60px] w-full' />
              </div>
            ))}
      </div>
    </div>
  )
}

export default Sales
