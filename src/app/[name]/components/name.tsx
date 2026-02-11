'use client'

import React, { useEffect } from 'react'
import PrimaryDetails from './primaryDetails'
import { useName } from '../hooks/useName'
import Listings from './listings'
import Offers from './offers'
import ActivityPanel from './activity'
import Register from './register'
import Actions from './actions'
import { getRegistrationStatus } from '@/utils/getRegistrationStatus'
import { REGISTERED, UNREGISTERED } from '@/constants/domains/registrationStatuses'
import Categories from './categories'
import SecondaryDetails from './secondaryDetails'
import Metadata from './metadata'
// import Metadata from './metadata'

interface Props {
  name: string
}

const NamePage: React.FC<Props> = ({ name }) => {
  const { nameDetails, nameDetailsIsLoading, nameOffers, nameOffersIsLoading } = useName(name)

  // // Pre-warm the OG image cache in the background
  // useEffect(() => {
  //   if (typeof window !== 'undefined' && name) {
  //     // Small delay to not block initial page load
  //     const timer = setTimeout(() => {
  //       try {
  //         const img = new Image()
  //         img.src = `/api/og/name?name=${encodeURIComponent(name)}`
  //         // We don't need to do anything with the image, just trigger the request
  //       } catch (error) {
  //         console.error('Error pre-warming OG image cache:', error)
  //       }
  //     }, 1000)

  //     return () => clearTimeout(timer)
  //   }
  // }, [name])

  useEffect(() => {
    document.scrollingElement?.scrollTo({
      top: 0,
      behavior: 'instant',
    })
  }, [name])

  const isSubname = name.split('.').length > 2
  const registrationStatus = nameDetails
    ? isSubname
      ? REGISTERED
      : getRegistrationStatus(nameDetails.expiry_date)
    : UNREGISTERED
  const isRegistered = registrationStatus === REGISTERED

  return (
    <div className='dark mx-auto flex min-h-[calc(100dvh-52px)] max-w-7xl flex-col items-center gap-3 pt-3 md:min-h-[calc(100dvh-70px)]'>
      <div className='px-md flex w-full flex-row justify-between'>
        <Actions nameDetails={nameDetails} />
      </div>
      <div className='flex w-full flex-col gap-1 sm:gap-4 lg:flex-row'>
        <div className='flex h-fit flex-col gap-1 sm:gap-4 sm:rounded-lg lg:w-2/5'>
          <PrimaryDetails
            name={name}
            nameDetails={nameDetails}
            nameDetailsIsLoading={nameDetailsIsLoading}
            registrationStatus={registrationStatus}
            isSubname={isSubname}
          />
          <div className='hidden lg:block'>
            <Categories nameDetails={nameDetails} nameDetailsIsLoading={nameDetailsIsLoading} />
          </div>
          <div className='hidden lg:block'>
            <Metadata name={name} nameOwner={nameDetails?.owner} />
          </div>
          <div className='hidden lg:block'>
            <SecondaryDetails nameDetails={nameDetails} nameDetailsIsLoading={nameDetailsIsLoading} />
          </div>
        </div>
        <div className='flex w-full flex-col gap-1 sm:gap-4 lg:w-3/5'>
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
          <div className='lg:hidden'>
            <Categories nameDetails={nameDetails} nameDetailsIsLoading={nameDetailsIsLoading} />
          </div>
          <div className='lg:hidden'>
            <Metadata name={name} />
          </div>
          <div className='lg:hidden'>
            <SecondaryDetails nameDetails={nameDetails} nameDetailsIsLoading={nameDetailsIsLoading} />
          </div>
          <ActivityPanel name={name} />
        </div>
      </div>
    </div>
  )
}

export default NamePage
