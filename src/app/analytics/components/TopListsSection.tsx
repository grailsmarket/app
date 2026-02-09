'use client'

import React from 'react'
import TopListCard from './TopListCard'
import {
  useSalesChart,
  useOffersChart,
  useTopOffers,
  useTopSales,
  useVolumeChart,
  useTopRegistrations,
  useRegistrationsChart,
} from '../hooks/useAnalyticsData'

interface TopListsSectionProps {
  category?: string
}

const TopListsSection: React.FC<TopListsSectionProps> = ({ category }) => {
  const hookOptions = category ? { categoryOverride: category } : undefined
  const { data: offersData, isLoading: offersLoading } = useTopOffers(hookOptions)
  const { data: salesData, isLoading: salesLoading } = useTopSales(hookOptions)
  const { data: saleChartData, isLoading: saleChartLoading } = useSalesChart(hookOptions)
  const { data: offerChartData, isLoading: offerChartLoading } = useOffersChart(hookOptions)
  const { data: volumeChartData, isLoading: volumeChartLoading } = useVolumeChart(hookOptions)
  const { data: registrationsData, isLoading: registrationsLoading } = useTopRegistrations(hookOptions)
  const { data: registrationChartData, isLoading: registrationChartLoading } = useRegistrationsChart(hookOptions)

  return (
    <section>
      <div className='border-tertiary border-b-2'>
        <div className='grid grid-cols-1 xl:grid-cols-3'>
          <TopListCard
            title='Top Sales'
            type='sales'
            isLoading={salesLoading}
            data={salesData?.data?.results}
            chartData={saleChartData?.data?.points}
            chartLoading={saleChartLoading}
            volumeData={volumeChartData?.data?.points}
            volumeLoading={volumeChartLoading}
          />
          <TopListCard
            title='Top Offers'
            type='offers'
            isLoading={offersLoading}
            data={offersData?.data?.results}
            chartData={offerChartData?.data?.points}
            chartLoading={offerChartLoading}
          />
          {/* <TopListCard
            title='Top Listings'
            type='listings'
            isLoading={listingsLoading}
            data={listingsData?.data?.results}
            chartData={listingChartData?.data?.points}
            chartLoading={listingChartLoading}
          /> */}
          <TopListCard
            title='Top Registrations'
            type='registrations'
            isLoading={registrationsLoading}
            data={registrationsData?.data?.results}
            chartData={registrationChartData?.data?.points}
            chartLoading={registrationChartLoading}
          />
        </div>
      </div>
    </section>
  )
}

export default TopListsSection
