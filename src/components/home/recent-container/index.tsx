import React from 'react'
import RecentListings from './listings'
import SalesAndRegs from './salesAndRegs'

const RecentContainer = () => {
  return (
    <div className='bg-background p-xl border-primary shadow-medium flex h-fit w-full flex-row gap-4 rounded-md border-2'>
      <div className='w-1/2'>
        <RecentListings />
      </div>
      <div className='w-1/2'>
        <SalesAndRegs />
      </div>
    </div>
  )
}

export default RecentContainer
