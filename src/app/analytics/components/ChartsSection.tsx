'use client'

import React from 'react'
import { useAppSelector } from '@/state/hooks'
import { selectAnalytics } from '@/state/reducers/analytics'
import AnalyticsChart from './AnalyticsChart'
import { useListingsChart, useOffersChart, useSalesChart } from '../hooks/useAnalyticsData'

const ChartsSection: React.FC = () => {
  const { source } = useAppSelector(selectAnalytics)
  const { data: listingsData, isLoading: listingsLoading } = useListingsChart()
  const { data: offersData, isLoading: offersLoading } = useOffersChart()
  const { data: salesData, isLoading: salesLoading } = useSalesChart()

  return (
    <section>
      <div className='border-tertiary overflow-hidden border-b-2'>
        <div className='grid grid-cols-1 xl:grid-cols-3'>
          <AnalyticsChart title='Sales' data={salesData?.data?.points} source={source} isLoading={salesLoading} />
          <AnalyticsChart title='Offers' data={offersData?.data?.points} source={source} isLoading={offersLoading} />
          <AnalyticsChart
            title='Listings'
            data={listingsData?.data?.points}
            source={source}
            isLoading={listingsLoading}
          />
        </div>
      </div>
    </section>
  )
}

export default ChartsSection
