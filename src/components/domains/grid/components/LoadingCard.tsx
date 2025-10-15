import React from 'react'
import LoadingCell from '@/components/ui/loadingCell'

const LoadingCard = () => {
  return (
    <div className={`group flex w-full h-full bg-secondary animate-pulse rounded-lg flex-1 cursor-pointer flex-col gap-y-px`}>
      <LoadingCell height='auto' width='100%' radius='0px' className='aspect-square' />
      <div className='flex w-full flex-1 flex-col justify-between'>
        <div className='flex w-full flex-col gap-2 pt-4 pl-4'>
          <LoadingCell height='12px' width='55%' radius='2px' />
          <LoadingCell height='12px' width='35%' radius='2px' />
        </div>
        <div className='flex h-12 items-center pl-4'>
          <LoadingCell height='12px' width='40%' radius='2px' />
        </div>
      </div>
    </div>
  )
}

export default LoadingCard
