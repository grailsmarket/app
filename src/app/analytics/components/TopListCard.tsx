'use client'

import React, { useMemo } from 'react'
import LoadingCell from '@/components/ui/loadingCell'
import { AnalyticsListing, AnalyticsOffer, AnalyticsSale, ChartDataPoint } from '@/types/analytics'
import { ListingRow, OfferRow, SaleRow } from './AnalyticsRow'
import { useAppSelector } from '@/state/hooks'
import { selectAnalytics } from '@/state/reducers/analytics'
import Price from '@/components/ui/price'
import { ETH_ADDRESS } from '@/constants/web3/tokens'

interface TopListCardProps {
  title: string
  isLoading: boolean
  type: 'listings' | 'offers' | 'sales'
  data?: AnalyticsListing[] | AnalyticsOffer[] | AnalyticsSale[]
  chartData?: ChartDataPoint[]
  chartLoading?: boolean
  volumeData?: ChartDataPoint[]
  volumeLoading?: boolean
}

const LoadingSkeleton = () => (
  <div className='flex flex-col'>
    {Array.from({ length: 10 }).map((_, i) => (
      <div key={i} className='border-tertiary flex h-[52px] items-center gap-3 border-b px-3'>
        <LoadingCell width='24px' height='24px' radius='4px' />
        <LoadingCell width='32px' height='32px' radius='4px' />
        <LoadingCell width='100px' height='20px' />
        <div className='flex-1' />
        <LoadingCell width='60px' height='20px' />
        <LoadingCell width='80px' height='28px' className='hidden sm:block' />
      </div>
    ))}
  </div>
)

const EmptyState = ({ title }: { title: string }) => (
  <div className='flex h-[200px] items-center justify-center'>
    <p className='text-neutral'>No {title.toLowerCase()} found</p>
  </div>
)

const TopListCard: React.FC<TopListCardProps> = ({
  title,
  isLoading,
  type,
  data,
  chartData,
  chartLoading,
  volumeData,
}) => {
  const { source } = useAppSelector(selectAnalytics)
  const totalListings = useMemo(
    () =>
      chartData?.reduce(
        (acc, curr) => acc + (source === 'all' ? curr.total : source === 'grails' ? curr.grails : curr.opensea),
        0
      ),
    [chartData, source]
  )

  const totalVolume = useMemo(
    () =>
      volumeData?.reduce(
        (acc, curr) =>
          acc +
          (source === 'all' ? BigInt(curr.total) : source === 'grails' ? BigInt(curr.grails) : BigInt(curr.opensea)),
        BigInt(0)
      ),
    [volumeData, source]
  )

  return (
    <div className='border-tertiary flex flex-col border-b last:border-r-0 xl:border-r-2 xl:border-b-0'>
      <div className='bg-secondary flex items-center justify-between px-2 py-3 sm:px-4 xl:bg-transparent'>
        <h3 className='text-xl font-bold'>{title}</h3>
        <div className='text-md text-neutral font-medium'>
          {chartLoading ? (
            <LoadingCell width='24px' height='24px' radius='4px' />
          ) : (
            <div className='flex items-center'>
              <p>
                {totalListings?.toLocaleString()} {type.toLowerCase()}
              </p>
              {totalVolume ? (
                <>
                  <p className='mr-1'>,</p>
                  <Price
                    price={Number(totalVolume)}
                    currencyAddress={ETH_ADDRESS}
                    iconSize='16px'
                    fontSize='text-md font-medium'
                    showFullPrice
                  />
                  <p className='ml-1'>vol</p>
                </>
              ) : null}
            </div>
          )}
        </div>
      </div>
      <div className=''>
        {isLoading ? (
          <LoadingSkeleton />
        ) : !data || data.length === 0 ? (
          <EmptyState title={title} />
        ) : type === 'listings' ? (
          (data as AnalyticsListing[]).map((item, index) => <ListingRow key={item.id} listing={item} index={index} />)
        ) : type === 'offers' ? (
          (data as AnalyticsOffer[]).map((item, index) => <OfferRow key={item.id} offer={item} index={index} />)
        ) : (
          (data as AnalyticsSale[]).map((item, index) => <SaleRow key={item.id} sale={item} index={index} />)
        )}
      </div>
    </div>
  )
}

export default TopListCard
