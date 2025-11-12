import React from 'react'
import RecentListings from './listings'
import SalesAndRegs from './salesAndRegs'

const RecentContainer = () => {
  return (
    <div className='bg-secondary border-tertiary p-lg sm:px-xl md:border-primary shadow-medium flex h-full w-full flex-col justify-between gap-4 rounded-none border-t-2 md:flex-row md:rounded-md md:border-2 2xl:flex-col'>
      <div className='w-full md:w-1/2 2xl:w-full'>
        <SalesAndRegs />
      </div>
      <div className='w-full md:w-1/2 2xl:w-full'>
        <RecentListings />
      </div>
    </div>
  )
}

export default RecentContainer
