import React from 'react'
import RecentListings from './listings'
import SalesAndRegs from './salesAndRegs'

const RecentContainer = () => {
  return (
    <div className='bg-background p-xl border-primary shadow-medium flex flex-col md:flex-row h-fit w-full gap-4 rounded-md border-2'>
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
