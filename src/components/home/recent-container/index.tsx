import React from 'react'
import Registrations from './registrations'
import Sales from './sales'
import Premium from './premium'

const RecentContainer = () => {
  return (
    <div className='flex w-full flex-row flex-wrap items-center justify-center gap-4 xl:flex-nowrap'>
      <div className='w-full lg:w-[calc(50%-8px)] xl:w-1/3'>
        <Sales />
      </div>
      <div className='w-full lg:w-[calc(50%-8px)] xl:w-1/3'>
        <Premium />
      </div>
      <div className='w-full xl:w-1/3'>
        <Registrations />
      </div>
    </div>
  )
}

export default RecentContainer
