'use client'

import React from 'react'
import TopListCard from './TopListCard'
import { useTopListings, useTopOffers, useTopSales } from '../hooks/useAnalyticsData'

const TopListsSection: React.FC = () => {
  const { data: listingsData, isLoading: listingsLoading } = useTopListings()
  const { data: offersData, isLoading: offersLoading } = useTopOffers()
  const { data: salesData, isLoading: salesLoading } = useTopSales()

  return (
    <section>
      <div className='border-tertiary overflow-hidden border-b-2'>
        <div className='grid grid-cols-1 xl:grid-cols-3'>
          <TopListCard
            title='Top Listings'
            type='listings'
            isLoading={listingsLoading}
            data={listingsData?.data?.results}
          />
          <TopListCard title='Top Offers' type='offers' isLoading={offersLoading} data={offersData?.data?.results} />
          <TopListCard title='Top Sales' type='sales' isLoading={salesLoading} data={salesData?.data?.results} />
        </div>
      </div>
    </section>
  )
}

export default TopListsSection
