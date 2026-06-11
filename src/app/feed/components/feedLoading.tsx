import React from 'react'
import LoadingCell from '@/components/ui/loadingCell'

interface FeedLoadingProps {
  count?: number
}

const FeedLoading: React.FC<FeedLoadingProps> = ({ count = 6 }) => (
  <div className='flex flex-col gap-3'>
    {Array.from({ length: count }).map((_, index) => (
      <article key={index} className='bg-secondary border-tertiary rounded-lg border-2 p-3 shadow-sm @[40rem]/app:px-4'>
        <div className='flex flex-col gap-4'>
          <div className='flex w-full flex-wrap items-center justify-between'>
            <div className='flex flex-wrap items-center gap-2'>
              <LoadingCell height='32px' width='32px' radius='50%' />
              <LoadingCell height='20px' width='100px' />
              <LoadingCell height='16px' width='80px' />
              <LoadingCell height='32px' width='32px' radius='4px' />
              <LoadingCell height='22px' width='100px' />
            </div>
            <LoadingCell height='14px' width='60px' className='hidden @[48rem]/app:block' />
          </div>

          <div className='flex flex-col gap-2'>
            <LoadingCell height='20px' width='80%' />
          </div>
        </div>
      </article>
    ))}
  </div>
)

export default FeedLoading
