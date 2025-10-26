'use client'

import React from 'react'
import NameDetails from './nameDetails'
import { useName } from '../hooks/useName'
import Listings from './listings'
import Offers from './offers'
import ActivityPanel from './activity'

interface Props {
  name: string
}

const NamePage: React.FC<Props> = ({ name }) => {
  const { nameDetails, nameDetailsIsLoading, nameOffers, nameOffersIsLoading } = useName(name)

  return (
    <div className='dark mx-auto flex flex-col items-center max-w-7xl pt-40'>
      <div className='flex flex-row gap-4 w-full'>
        <div className='border-primary bg-secondary flex w-2/5 flex-col gap-4 overflow-hidden rounded-lg border-2'>
          <NameDetails name={name} nameDetails={nameDetails} nameDetailsIsLoading={nameDetailsIsLoading} />
        </div>
        <div className='w-3/5 flex flex-col gap-4'>
          <Listings name={name} listings={nameDetails?.listings || []} listingsLoading={nameDetailsIsLoading} />
          <Offers offers={nameOffers ?? []} offersLoading={nameOffersIsLoading} />
          <ActivityPanel name={name} />
        </div>
      </div>
    </div>
  )
}

export default NamePage
