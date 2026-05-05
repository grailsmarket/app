'use client'

import React, { type RefObject, useEffect } from 'react'
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
import Roles from './roles'
import KeywordMetrics from './keywordMetrics'
import SimilarNames from './similarNames'
import { cn } from '@/utils/tailwind'
// import Metadata from './metadata'

interface Props {
  name: string
  isWidget?: boolean
  containerWidth?: number
  scrollElementRef?: RefObject<HTMLDivElement | null>
}

const WIDGET_WIDE_BREAKPOINT = 768

const NamePage: React.FC<Props> = ({ name, isWidget = false, containerWidth = 0, scrollElementRef }) => {
  const {
    nameDetails,
    nameDetailsIsLoading,
    nameOffers,
    nameOffersIsLoading,
    metadata,
    isMetadataLoading,
    roles,
    isRolesLoading,
    openEditMetadataModal,
  } = useName(name)

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
    const scrollTarget = isWidget ? scrollElementRef?.current : document.scrollingElement

    scrollTarget?.scrollTo({
      top: 0,
      behavior: 'instant',
    })
  }, [isWidget, name, scrollElementRef])

  const useWideWidgetLayout = isWidget && containerWidth >= WIDGET_WIDE_BREAKPOINT

  const isSubname = name.split('.').length > 2
  const registrationStatus = nameDetails
    ? isSubname
      ? REGISTERED
      : getRegistrationStatus(nameDetails.expiry_date)
    : UNREGISTERED
  const isRegistered = registrationStatus === REGISTERED
  // const isUnregistered = registrationStatus === UNREGISTERED || registrationStatus === PREMIUM

  return (
    <div
      className={cn(
        'dark mx-auto flex max-w-7xl flex-col items-center gap-3 pt-3',
        isWidget ? 'min-h-full overflow-x-hidden' : 'min-h-[calc(100dvh-52px)] md:min-h-[calc(100dvh-70px)]'
      )}
    >
      <div className='px-md flex w-full flex-row justify-between'>
        <Actions nameDetails={nameDetails} />
      </div>
      <div
        className={cn(
          'flex w-full flex-col gap-1 sm:gap-4',
          isWidget ? useWideWidgetLayout && 'flex-row' : 'lg:flex-row'
        )}
      >
        <div
          className={cn(
            'flex h-fit flex-col gap-1 sm:gap-4 sm:rounded-lg',
            isWidget ? useWideWidgetLayout && 'w-2/5' : 'lg:w-2/5'
          )}
        >
          <PrimaryDetails
            name={name}
            nameDetails={nameDetails}
            nameDetailsIsLoading={nameDetailsIsLoading}
            registrationStatus={registrationStatus}
            isSubname={isSubname}
            openEditMetadataModal={openEditMetadataModal}
          />
          <div className={cn(isWidget ? (useWideWidgetLayout ? 'block' : 'hidden') : 'hidden lg:block')}>
            <Categories nameDetails={nameDetails} nameDetailsIsLoading={nameDetailsIsLoading} />
          </div>
          <div className={cn(isWidget ? (useWideWidgetLayout ? 'block' : 'hidden') : 'hidden lg:block')}>
            <KeywordMetrics
              name={name}
              expiryDate={nameDetails?.expiry_date}
              ownerAddress={nameDetails?.owner}
              categories={nameDetails?.clubs}
            />
          </div>
          <div className={cn(isWidget ? (useWideWidgetLayout ? 'block' : 'hidden') : 'hidden lg:block')}>
            <Metadata
              name={name}
              registrationStatus={registrationStatus}
              nameOwner={nameDetails?.owner}
              metadata={metadata}
              isMetadataLoading={isMetadataLoading}
              openEditMetadataModal={openEditMetadataModal}
            />
          </div>
          <div className={cn(isWidget ? (useWideWidgetLayout ? 'block' : 'hidden') : 'hidden lg:block')}>
            <Roles
              name={name}
              registrationStatus={registrationStatus}
              nameOwner={nameDetails?.owner}
              metadata={metadata}
              roles={roles}
              isRolesLoading={isRolesLoading}
            />
          </div>
          <div className={cn(isWidget ? (useWideWidgetLayout ? 'block' : 'hidden') : 'hidden lg:block')}>
            <SecondaryDetails nameDetails={nameDetails} nameDetailsIsLoading={nameDetailsIsLoading} roles={roles} />
          </div>
        </div>
        <div
          className={cn('flex w-full flex-col gap-1 sm:gap-4', isWidget ? useWideWidgetLayout && 'w-3/5' : 'lg:w-3/5')}
        >
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
          <div className={cn(isWidget ? (useWideWidgetLayout ? 'hidden' : 'block') : 'lg:hidden')}>
            <Categories nameDetails={nameDetails} nameDetailsIsLoading={nameDetailsIsLoading} />
          </div>
          <div className={cn(isWidget ? (useWideWidgetLayout ? 'hidden' : 'block') : 'lg:hidden')}>
            <KeywordMetrics
              name={name}
              expiryDate={nameDetails?.expiry_date}
              ownerAddress={nameDetails?.owner}
              categories={nameDetails?.clubs}
            />
          </div>
          <div className={cn(isWidget ? (useWideWidgetLayout ? 'hidden' : 'block') : 'lg:hidden')}>
            <Metadata
              name={name}
              registrationStatus={registrationStatus}
              nameOwner={nameDetails?.owner}
              metadata={metadata}
              isMetadataLoading={isMetadataLoading}
              openEditMetadataModal={openEditMetadataModal}
            />
          </div>
          <div className={cn(isWidget ? (useWideWidgetLayout ? 'hidden' : 'block') : 'lg:hidden')}>
            <Roles
              name={name}
              registrationStatus={registrationStatus}
              nameOwner={nameDetails?.owner}
              metadata={metadata}
              roles={roles}
              isRolesLoading={isRolesLoading}
            />
          </div>
          <div className={cn(isWidget ? (useWideWidgetLayout ? 'hidden' : 'block') : 'lg:hidden')}>
            <SecondaryDetails nameDetails={nameDetails} nameDetailsIsLoading={nameDetailsIsLoading} roles={roles} />
          </div>
          <ActivityPanel name={name} />
          <SimilarNames name={name} />
        </div>
      </div>
    </div>
  )
}

export default NamePage
