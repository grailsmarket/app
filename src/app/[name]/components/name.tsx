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
    <div className='dark mx-auto flex max-w-7xl flex-col items-center pt-40'>
      <div className='flex w-full flex-row gap-4'>
        <div className='border-primary bg-secondary flex w-2/5 flex-col gap-4 overflow-hidden rounded-lg border-2'>
          <NameDetails name={name} nameDetails={nameDetails} nameDetailsIsLoading={nameDetailsIsLoading} />
        </div>
        <div className='flex w-3/5 flex-col gap-4'>
          <Listings name={name} listings={nameDetails?.listings || []} listingsLoading={nameDetailsIsLoading} />
          <Offers offers={nameOffers ?? []} offersLoading={nameOffersIsLoading} domain={nameDetails} />
          <ActivityPanel name={name} />
        </div>
      </div>
    </div>
  )
}

export default NamePage
