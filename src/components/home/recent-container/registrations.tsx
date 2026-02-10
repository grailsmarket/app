'use client'

import React from 'react'
import TableLoadingRow from '@/components/domains/table/components/TableLoadingRow'
import Link from 'next/link'
import { Arrow } from 'ethereum-identity-kit'
import { useAppDispatch } from '@/state/hooks'
import { setMarketplaceActivityFiltersType } from '@/state/reducers/filters/marketplaceActivityFilters'
import { useTopRegistrations } from '@/app/analytics/hooks/useAnalyticsData'
import { RegistrationRow } from '@/app/analytics/components/AnalyticsRow'

const Registrations = () => {
  const dispatch = useAppDispatch()
  const { data: registrationsData, isLoading: registrationsLoading } = useTopRegistrations({
    periodOverride: '7d',
    sourceOverride: 'all',
    limitOverride: 7,
    categoryOverride: null,
  })

  return (
    <div className='flex flex-col'>
      <div className='p-md lg:px-lg flex w-full items-center justify-between'>
        <h2 className='font-sedan-sc text-3xl font-medium sm:text-4xl'>Top Registrations</h2>
        <Link
          href='/marketplace?tab=activity'
          onClick={() => {
            dispatch(setMarketplaceActivityFiltersType('mint'))
          }}
          className='text-primary hover:text-primary/80 group flex items-center justify-end gap-2 text-center text-lg font-semibold sm:text-xl'
        >
          <p>View All</p>
          <Arrow className='text-primary h-3 w-3 rotate-180 transition-all duration-300 group-hover:translate-x-1' />
        </Link>
      </div>
      <div className='border-tertiary bg-secondary flex flex-col gap-0 rounded-md border-2 border-t'>
        {registrationsLoading
          ? new Array(7).fill(null).map((_, index) => (
              <div key={index} className='px-lg border-tertiary flex h-[60px] w-full items-center border-b'>
                <TableLoadingRow displayedColumns={['domain', 'price', 'actions']} />
              </div>
            ))
          : registrationsData?.data?.results?.map((registration, index) => (
              <div key={registration.id}>
                <RegistrationRow registration={registration} index={index} className='h-[60px] w-full' />
              </div>
            ))}
      </div>
    </div>
  )
}

export default Registrations
