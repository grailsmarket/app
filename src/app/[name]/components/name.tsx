'use client'

import React from 'react'
import NameDetails from './nameDetails'
import { useName } from '../hooks/useName'
import Listings from './listings'
import Offers from './offers'
import ActivityPanel from './activity'
import Register from './register'
import Actions from './actions'
import { getRegistrationStatus } from '@/utils/getRegistrationStatus'
import { REGISTERED } from '@/constants/domains/registrationStatuses'

interface Props {
  name: string
}

const NamePage: React.FC<Props> = ({ name }) => {
  const { nameDetails, nameDetailsIsLoading, nameOffers, nameOffersIsLoading } = useName(name)

  const registrationStatus = nameDetails ? getRegistrationStatus(nameDetails.expiry_date) : REGISTERED
  const isRegistered = registrationStatus === REGISTERED

  return (
    <div className='dark mx-auto flex max-w-7xl flex-col items-center gap-3 pt-20 pb-4'>
      <div className='px-md flex w-full flex-row justify-between'>
        <Actions nameDetails={nameDetails} />
      </div>
      <div className='flex w-full flex-col gap-4 lg:flex-row'>
        <div className='border-primary bg-secondary flex h-fit flex-col gap-4 overflow-hidden rounded-lg border-2 xl:w-2/5'>
          <NameDetails
            name={name}
            nameDetails={nameDetails}
            nameDetailsIsLoading={nameDetailsIsLoading}
            registrationStatus={registrationStatus}
          />
        </div>
        <div className='flex w-full flex-col gap-4 xl:w-3/5'>
          {isRegistered ? (
            <>
              <Listings
                domain={nameDetails}
                listings={nameDetails?.listings || []}
                listingsLoading={nameDetailsIsLoading}
              />
              <Offers offers={nameOffers ?? []} offersLoading={nameOffersIsLoading} domain={nameDetails} />
            </>
          ) : (
            <Register nameDetails={nameDetails} registrationStatus={registrationStatus} />
          )}
          <ActivityPanel name={name} />
        </div>
      </div>
    </div>
  )
}

export default NamePage
