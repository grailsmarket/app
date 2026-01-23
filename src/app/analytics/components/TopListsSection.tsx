'use client'

import React from 'react'
import TopListCard from './TopListCard'
import {
  useSalesChart,
  useListingsChart,
  useOffersChart,
  useTopListings,
  useTopOffers,
  useTopSales,
  useVolumeChart,
} from '../hooks/useAnalyticsData'

const TopListsSection: React.FC = () => {
  const { data: listingsData, isLoading: listingsLoading } = useTopListings()
  const { data: offersData, isLoading: offersLoading } = useTopOffers()
  const { data: salesData, isLoading: salesLoading } = useTopSales()
  const { data: saleChartData, isLoading: saleChartLoading } = useSalesChart()
  const { data: offerChartData, isLoading: offerChartLoading } = useOffersChart()
  const { data: listingChartData, isLoading: listingChartLoading } = useListingsChart()
  const { data: volumeChartData, isLoading: volumeChartLoading } = useVolumeChart()

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
          <TopListCard
            title='Top Listings'
            type='listings'
            isLoading={listingsLoading}
            data={listingsData?.data?.results}
            chartData={listingChartData?.data?.points}
            chartLoading={listingChartLoading}
          />
        </div>
      </div>
    </section>
  )
}

export default TopListsSection
