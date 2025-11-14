import React from 'react'
import RecentListings from './listings'
import SalesAndRegs from './salesAndRegs'

const RecentContainer = () => {
  return (
    <div className='bg-secondary border-tertiary p-sm py-md shadow-medium flex h-full w-full flex-col justify-between gap-4 md:flex-row border-t-2 xl:border-l lg:flex-col'>
      <div className='w-full md:w-1/2 lg:w-full'>
        <SalesAndRegs />
      </div>
      <div className='w-full md:w-1/2 lg:w-full'>
        <RecentListings />
      </div>
    </div>
  )
}

export default RecentContainer
