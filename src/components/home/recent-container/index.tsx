import React from 'react'
import RecentListings from './listings'
import SalesAndRegs from './salesAndRegs'

const RecentContainer = () => {
  return (
    <div className='bg-secondary h-fit w-full overflow-y-scroll lg:h-[calc(100dvh-70px)] lg:w-2/5'>
      <div className='bg-secondary border-tertiary p-md shadow-medium flex h-full w-full flex-col gap-4 border-t-2 md:flex-row lg:flex-col xl:border-l'>
        <div className='w-full md:w-1/2 lg:w-full'>
          <SalesAndRegs />
        </div>
        <div className='w-full md:w-1/2 lg:w-full'>
          <RecentListings />
        </div>
      </div>
    </div>
  )
}

export default RecentContainer
