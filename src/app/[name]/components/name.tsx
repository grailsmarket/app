'use client'

import React, { useEffect, useState } from 'react'
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
import CommentsPanel from './commentsPanel'
import { cn } from '@/utils/tailwind'

interface Props {
  name: string
}

const NAME_PAGE_TABS = [
  { label: 'Market', value: 'market' },
  { label: 'Activity', value: 'activity' },
  { label: 'Details', value: 'details' },
  { label: 'Recommended', value: 'recommended' },
] as const

type NamePageTab = (typeof NAME_PAGE_TABS)[number]['value']

const NamePage: React.FC<Props> = ({ name }) => {
  const [selectedTab, setSelectedTab] = useState<NamePageTab>('market')
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
    setSelectedTab('market')
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

  const selectedTabIndex = NAME_PAGE_TABS.findIndex((tab) => tab.value === selectedTab)

  const renderSelectedTab = () => {
    switch (selectedTab) {
      case 'market':
        return isRegistered ? (
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
        )
      case 'activity':
        return <ActivityPanel name={name} />
      case 'details':
        return (
          <>
            <Metadata
              name={name}
              registrationStatus={registrationStatus}
              nameOwner={nameDetails?.owner}
              metadata={metadata}
              isMetadataLoading={isMetadataLoading}
              openEditMetadataModal={openEditMetadataModal}
            />
            <Roles
              name={name}
              registrationStatus={registrationStatus}
              nameOwner={nameDetails?.owner}
              metadata={metadata}
              roles={roles}
              isRolesLoading={isRolesLoading}
            />
            <SecondaryDetails nameDetails={nameDetails} nameDetailsIsLoading={nameDetailsIsLoading} roles={roles} />
          </>
        )
      case 'recommended':
        return <SimilarNames name={name} />
    }
  }

  return (
    <div className='dark mx-auto flex min-h-[calc(100dvh-52px)] max-w-7xl flex-col items-center gap-3 pt-3 md:min-h-[calc(100dvh-70px)]'>
      <div className='px-md flex w-full flex-row justify-between'>
        <Actions nameDetails={nameDetails} />
      </div>
      <div className='flex w-full flex-col gap-1 @[40rem]/app:gap-4 @[64rem]/app:flex-row'>
        <div className='flex h-fit flex-col gap-1 @[40rem]/app:gap-4 @[40rem]/app:rounded-lg @[64rem]/app:w-2/5'>
          <PrimaryDetails
            name={name}
            nameDetails={nameDetails}
            nameDetailsIsLoading={nameDetailsIsLoading}
            registrationStatus={registrationStatus}
            isSubname={isSubname}
            openEditMetadataModal={openEditMetadataModal}
          />
          <div className='hidden @[64rem]/app:block'>
            <Categories nameDetails={nameDetails} nameDetailsIsLoading={nameDetailsIsLoading} />
          </div>
          <div className='hidden @[64rem]/app:block'>
            <KeywordMetrics
              name={name}
              expiryDate={nameDetails?.expiry_date}
              ownerAddress={nameDetails?.owner}
              categories={nameDetails?.clubs}
            />
          </div>
        </div>
        <div className='flex w-full flex-col gap-1 @[40rem]/app:gap-4 @[64rem]/app:w-3/5'>
          <div className='@[64rem]/app:hidden'>
            <Categories nameDetails={nameDetails} nameDetailsIsLoading={nameDetailsIsLoading} />
          </div>
          <div className='@[64rem]/app:hidden'>
            <KeywordMetrics
              name={name}
              expiryDate={nameDetails?.expiry_date}
              ownerAddress={nameDetails?.owner}
              categories={nameDetails?.clubs}
            />
          </div>
          <div className='bg-secondary border-tertiary relative flex w-full overflow-hidden border-b-2 @[40rem]/app:rounded-t-lg @[40rem]/app:border-x-2 @[40rem]/app:border-t-2'>
            <div
              className='bg-primary pointer-events-none absolute bottom-0 left-0 h-0.5 w-1/4 rounded-full transition-transform duration-300 ease-out'
              style={{ transform: `translateX(${Math.max(selectedTabIndex, 0) * 100}%)` }}
            />
            {NAME_PAGE_TABS.map((tab) => {
              const isActive = selectedTab === tab.value

              return (
                <button
                  key={tab.value}
                  type='button'
                  onClick={() => setSelectedTab(tab.value)}
                  className={cn(
                    'py-md flex flex-1 cursor-pointer items-center justify-center px-2 text-center text-lg font-semibold transition-colors @[40rem]/app:text-xl',
                    isActive ? 'text-primary font-bold' : 'text-neutral hover:text-foreground'
                  )}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
          <div className='flex w-full flex-col gap-1 @[40rem]/app:gap-4'>{renderSelectedTab()}</div>
          <div className='border-tertiary flex w-full flex-col border-t-2 pt-1 @[40rem]/app:pt-4'>
            <CommentsPanel name={name} nameDetails={nameDetails} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default NamePage
