import React from 'react'
import RecentListings from './listings'
import SalesAndRegs from './salesAndRegs'

const RecentContainer = () => {
  return (
    <div className='bg-secondary p-xl border-primary shadow-medium flex h-fit w-full flex-col gap-4 rounded-md border-2 md:flex-row 2xl:flex-col'>
      <div className='w-full md:w-1/2 2xl:w-full'>
        <RecentListings />
      </div>
      <div className='w-full md:w-1/2 2xl:w-full'>
        <SalesAndRegs />
      </div>
    </div>
  )
}

export default RecentContainer
