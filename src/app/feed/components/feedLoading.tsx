import React from 'react'
import LoadingCell from '@/components/ui/loadingCell'

interface FeedLoadingProps {
  count?: number
}

const FeedLoading: React.FC<FeedLoadingProps> = ({ count = 6 }) => (
  <div className='flex flex-col gap-3'>
    {Array.from({ length: count }).map((_, index) => (
      <article key={index} className='bg-secondary border-tertiary rounded-lg border-2 p-3 shadow-sm sm:px-4'>
        <div className='flex flex-col gap-4'>
          <div className='flex w-full flex-wrap items-center justify-between'>
            <div className='flex flex-wrap items-center gap-2'>
              <LoadingCell height='32px' width='32px' radius='50%' />
              <LoadingCell height='20px' width='110px' />
              <LoadingCell height='16px' width='95px' />
              <LoadingCell height='32px' width='32px' radius='4px' />
              <LoadingCell height='22px' width='130px' />
            </div>
            <LoadingCell height='14px' width='60px' className='hidden md:block' />
          </div>

          <div className='flex flex-col gap-2'>
            <LoadingCell height='22px' width='100%' />
            <LoadingCell height='22px' width='70%' />
          </div>

          <div className='flex items-center justify-between'>
            <LoadingCell height='18px' width='70px' />
            <LoadingCell height='14px' width='60px' className='md:hidden' />
          </div>
        </div>
      </article>
    ))}
  </div>
)

export default FeedLoading
