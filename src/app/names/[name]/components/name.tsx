'use client'

import React from 'react'
import NameDetails from './nameDetails'
import { useName } from '../hooks/useName'
import Listings from './listings'

interface Props {
  name: string
}

const NamePage: React.FC<Props> = ({ name }) => {
  const { nameDetails, nameDetailsIsLoading } = useName(name)

  return (
    <div className='dark mx-auto flex flex-col items-center max-w-7xl pt-40'>
      <div className='flex flex-row gap-4 w-full'>
        <div className='border-primary bg-secondary flex w-2/5 flex-col gap-4 overflow-hidden rounded-lg border-2'>
          <NameDetails name={name} nameDetails={nameDetails} nameDetailsIsLoading={nameDetailsIsLoading} />
        </div>
        <div className='w-3/5'>
          <Listings name={name} listings={nameDetails?.listings || []} nameDetailsIsLoading={nameDetailsIsLoading} />
        </div>
      </div>
    </div>
  )
}

export default NamePage
