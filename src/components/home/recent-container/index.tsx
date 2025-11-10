import React from 'react'
import RecentListings from './listings'
import SalesAndRegs from './salesAndRegs'

const RecentContainer = () => {
  return (
    <div className='bg-secondary p-xl border-primary shadow-medium flex h-fit w-full flex-col gap-4 rounded-md border-2 md:flex-row'>
      <div className='w-full md:w-1/2'>
        <RecentListings />
      </div>
      <div className='w-full md:w-1/2'>
        <SalesAndRegs />
      </div>
    </div>
  )
}

export default RecentContainer
