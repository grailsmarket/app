import React from 'react'
import LoadingCell from '@/components/ui/loadingCell'

interface FeedLoadingProps {
  count?: number
}

const FeedLoading: React.FC<FeedLoadingProps> = ({ count = 6 }) => (
  <div className='flex flex-col gap-3'>
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className='bg-secondary border-tertiary rounded-lg border-2 p-4'>
        <div className='flex gap-3'>
          <LoadingCell height='56px' width='56px' radius='8px' />
          <div className='flex flex-1 flex-col gap-2'>
            <LoadingCell height='20px' width='45%' />
            <LoadingCell height='16px' width='30%' />
            <LoadingCell height='48px' width='100%' />
          </div>
        </div>
      </div>
    ))}
  </div>
)

export default FeedLoading
