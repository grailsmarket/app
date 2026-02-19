import React from 'react'
import Registrations from './registrations'
import Sales from './sales'
import Premium from './premium'

const RecentContainer = () => {
  return (
    <div className='flex w-full flex-row flex-wrap items-center justify-center gap-4 xl:flex-nowrap'>
      <div className='fadeIn w-full lg:w-[calc(50%-8px)] xl:w-1/3'>
        <Sales />
      </div>
      <div className='fadeIn w-full lg:w-[calc(50%-8px)] xl:w-1/3' style={{ animationDelay: '300ms' }}>
        <Premium />
      </div>
      <div className='fadeIn w-full xl:w-1/3' style={{ animationDelay: '400ms' }}>
        <Registrations />
      </div>
    </div>
  )
}

export default RecentContainer
