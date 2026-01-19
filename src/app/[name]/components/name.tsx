'use client'

import React, { useEffect, useRef, useState } from 'react'
import PrimaryDetails from './primaryDetails'
import { useName } from '../hooks/useName'
import Listings from './listings'
import Offers from './offers'
import ActivityPanel from './activity'
import Register from './register'
import Actions from './actions'
import SimilarNames from './similarNames'
import { getRegistrationStatus } from '@/utils/getRegistrationStatus'
import { REGISTERED, UNREGISTERED } from '@/constants/domains/registrationStatuses'
import Categories from './categories'
import SecondaryDetails from './secondaryDetails'
import Metadata from './metadata'
import Roles from './roles'

interface Props {
  name: string
}

const NamePage: React.FC<Props> = ({ name }) => {
  const {
    nameDetails,
    nameDetailsIsLoading,
    nameOffers,
    nameOffersIsLoading,
    metadata,
    isMetadataLoading,
    roles,
    isRolesLoading,
  } = useName(name)
  const nameDetailsRef = useRef<HTMLDivElement>(null)
  const [nameDetailsHeight, setNameDetailsHeight] = useState<number | null>(null)

  // Measure name details panel height for activity panel max-height
  useEffect(() => {
    if (nameDetailsRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setNameDetailsHeight(entry.contentRect.height)
        }
      })
      resizeObserver.observe(nameDetailsRef.current)
      return () => resizeObserver.disconnect()
    }
  }, [])

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
  // const isUnregistered = registrationStatus === UNREGISTERED || registrationStatus === PREMIUM

  return (
    <div className='dark mx-auto flex min-h-[calc(100dvh-52px)] max-w-7xl flex-col items-center gap-3 pt-3 md:min-h-[calc(100dvh-70px)]'>
      <div className='px-md flex w-full flex-row justify-between'>
        <Actions nameDetails={nameDetails} />
      </div>
      <div className='flex w-full flex-col gap-1 sm:gap-4 lg:flex-row'>
        <div
          ref={nameDetailsRef}
          className='flex h-fit flex-col gap-1 sm:gap-4 sm:rounded-lg lg:w-2/5'
        >
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
            <Metadata
              name={name}
              nameOwner={nameDetails?.owner}
              metadata={metadata}
              isMetadataLoading={isMetadataLoading}
            />
          </div>
          <div className='hidden lg:block'>
            <Roles
              name={name}
              nameOwner={nameDetails?.owner}
              metadata={metadata}
              roles={roles}
              isRolesLoading={isRolesLoading}
            />
          </div>
          <div className='hidden lg:block'>
            <SecondaryDetails nameDetails={nameDetails} nameDetailsIsLoading={nameDetailsIsLoading} roles={roles} />
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
            <Metadata
              name={name}
              nameOwner={nameDetails?.owner}
              metadata={metadata}
              isMetadataLoading={isMetadataLoading}
            />
          </div>
          <div className='lg:hidden'>
            <Roles
              name={name}
              nameOwner={nameDetails?.owner}
              metadata={metadata}
              roles={roles}
              isRolesLoading={isRolesLoading}
            />
          </div>
          <div className='lg:hidden'>
            <SecondaryDetails nameDetails={nameDetails} nameDetailsIsLoading={nameDetailsIsLoading} roles={roles} />
          </div>
          <ActivityPanel name={name} maxHeight={nameDetailsHeight ? `${nameDetailsHeight}px` : undefined} />
        </div>
      </div>
      {/* Similar Names - Full width, spanning both columns */}
      <div className='w-full'>
        <SimilarNames name={name} />
      </div>
    </div>
  )
}

export default NamePage
