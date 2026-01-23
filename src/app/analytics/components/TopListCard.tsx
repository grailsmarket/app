'use client'

import React from 'react'
import LoadingCell from '@/components/ui/loadingCell'
import { AnalyticsListing, AnalyticsOffer, AnalyticsSale } from '@/types/analytics'
import { ListingRow, OfferRow, SaleRow } from './AnalyticsRow'

interface TopListCardProps {
  title: string
  isLoading: boolean
  type: 'listings' | 'offers' | 'sales'
  data?: AnalyticsListing[] | AnalyticsOffer[] | AnalyticsSale[]
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

const TopListCard: React.FC<TopListCardProps> = ({ title, isLoading, type, data }) => {
  return (
    <div className='border-tertiary flex flex-col overflow-hidden border-b last:border-r-0 xl:border-r xl:border-b-0'>
      <div className='px-4 py-3'>
        <h3 className='text-xl font-bold'>{title}</h3>
      </div>
      <div className='min-h-[200px]'>
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
