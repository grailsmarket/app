'use client'

import React, { useEffect, useState } from 'react'
import PrimaryDetails from './primaryDetails'
import { useName } from '../hooks/useName'
import Actions from './actions'
import { getRegistrationStatus } from '@/utils/getRegistrationStatus'
import { REGISTERED, UNREGISTERED } from '@/constants/domains/registrationStatuses'
import Categories from './categories'
import KeywordMetrics from './keywordMetrics'
import CommentsPanel from './commentsPanel'
import NamePageTabContent from './namePageTabContent'
import SimilarNames from './similarNames'
import { cn } from '@/utils/tailwind'

interface Props {
  name: string
}

const NAME_PAGE_TABS = [
  { label: 'Market', value: 'market' },
  { label: 'Activity', value: 'activity' },
  { label: 'Details', value: 'details' },
] as const

export type NamePageTab = (typeof NAME_PAGE_TABS)[number]['value']

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
          <div className='flex w-full flex-col gap-0 @[40rem]/app:gap-2.5'>
            <div className='bg-secondary border-tertiary relative flex w-full overflow-hidden border-b-2 @[40rem]/app:rounded-lg @[40rem]/app:border-x-2 @[40rem]/app:border-t-2'>
              <div
                className='bg-primary pointer-events-none absolute bottom-0 left-0 h-0.5 rounded-full transition-transform duration-300 ease-out'
                style={{
                  transform: `translateX(${Math.max(selectedTabIndex, 0) * 100}%)`,
                  width: `${100 / NAME_PAGE_TABS.length}%`,
                }}
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
            <div className='flex w-full flex-col @[40rem]/app:gap-2.5'>
              <NamePageTabContent
                selectedTab={selectedTab}
                name={name}
                isRegistered={isRegistered}
                registrationStatus={registrationStatus}
                nameDetails={nameDetails}
                nameDetailsIsLoading={nameDetailsIsLoading}
                nameOffers={nameOffers}
                nameOffersIsLoading={nameOffersIsLoading}
                metadata={metadata}
                isMetadataLoading={isMetadataLoading}
                roles={roles}
                isRolesLoading={isRolesLoading}
                openEditMetadataModal={openEditMetadataModal}
              />
            </div>
          </div>
          <div className='@[64rem]/app:hidde border-tertiary @[40rem]/app:border-t-2 @[40rem]/app:pt-4 @[64rem]/app:hidden'>
            <KeywordMetrics
              name={name}
              expiryDate={nameDetails?.expiry_date}
              ownerAddress={nameDetails?.owner}
              categories={nameDetails?.clubs}
            />
          </div>
          <div className='border-tertiary flex w-full flex-col @[64rem]/app:border-t-2 @[64rem]/app:pt-4'>
            <CommentsPanel name={name} nameDetails={nameDetails} />
          </div>
          <div className='border-tertiary flex w-full flex-col'>
            <SimilarNames name={name} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default NamePage
