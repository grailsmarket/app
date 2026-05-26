'use client'

import React, { useMemo } from 'react'
import { LoadingCell } from 'ethereum-identity-kit'
import { useTopSales } from '@/app/analytics/hooks/useAnalyticsData'
import { SaleRow } from '@/app/analytics/components/AnalyticsRow'
import RecentWidgetHeader from './RecentWidgetHeader'

const ROW_COUNT = 7
const ROW_CLASSES = 'h-[60px] w-full'

const RecentSalesWidget: React.FC = () => {
  const { data, isLoading } = useTopSales({
    periodOverride: '7d',
    sourceOverride: 'all',
    categoryOverride: null,
  })

  const sales = useMemo(() => data?.data?.results?.slice(0, ROW_COUNT) ?? [], [data])

  return (
    <div className='flex h-full flex-col'>
      <RecentWidgetHeader subtitle='Top sales · 7d' viewAllHref='/analytics' />
      <div className='flex-1 overflow-y-auto'>
        {isLoading ? (
          <SkeletonRows />
        ) : sales.length === 0 ? (
          <div className='text-neutral flex h-full items-center justify-center text-sm'>
            No sales in the last 7 days
          </div>
        ) : (
          sales.map((sale, index) => (
            <SaleRow key={sale.id} sale={sale} index={index} hideSeller className={ROW_CLASSES} />
          ))
        )}
      </div>
    </div>
  )
}

const SkeletonRows: React.FC = () => (
  <>
    {Array.from({ length: ROW_COUNT }).map((_, i) => (
      <div key={i} className='border-tertiary flex h-[60px] w-full items-center gap-2 border-b px-3'>
        <LoadingCell height='32px' width='32px' radius='4px' />
        <LoadingCell height='14px' width='100px' />
        <div className='flex-1' />
        <LoadingCell height='14px' width='64px' />
      </div>
    ))}
  </>
)

export default RecentSalesWidget
