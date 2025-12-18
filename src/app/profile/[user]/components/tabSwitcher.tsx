'use client'

import { cn } from '@/utils/tailwind'
import React, { useEffect, useMemo, useState } from 'react'
import { Address } from 'viem/accounts'
import Label from '@/components/ui/label'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { changeTab, ProfileTabType, selectUserProfile } from '@/state/reducers/portfolio/profile'
import { PROFILE_TABS } from '@/constants/domains/portfolio/tabs'
import { useUserContext } from '@/context/user'
import { useOffers } from '../hooks/useOffers'
import { useDomains } from '../hooks/useDomains'

interface TabSwitcherProps {
  user: Address | undefined
}

const TabSwitcher: React.FC<TabSwitcherProps> = ({ user }) => {
  const [mounted, setMounted] = useState(false)
  const { userAddress, authStatus } = useUserContext()
  const { selectedTab } = useAppSelector(selectUserProfile)
  const dispatch = useAppDispatch()
  const { profileTotalDomains, totalWatchlistDomains } = useDomains(user)
  const { totalReceivedOffers, totalSentOffers } = useOffers(user)

  const setProfileTab = (tab: ProfileTabType) => {
    dispatch(changeTab(tab))
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  const displayedTabs = useMemo(() => {
    if (!!user && !!userAddress && user.toLowerCase() === userAddress.toLowerCase() && authStatus === 'authenticated') {
      return PROFILE_TABS
    }

    return PROFILE_TABS.filter((tab) => tab.value !== 'watchlist')
  }, [authStatus, user, userAddress])

  const getTotalItems = useMemo(
    () => (tab: (typeof PROFILE_TABS)[number]) => {
      switch (tab.value) {
        case 'domains':
          return profileTotalDomains
        case 'watchlist':
          return totalWatchlistDomains
        case 'received_offers':
          return totalReceivedOffers
        case 'sent_offers':
          return totalSentOffers
        case 'activity':
          return 0
      }
    },
    [profileTotalDomains, totalWatchlistDomains, totalReceivedOffers, totalSentOffers]
  )

  // During SSR and initial mount, render all tabs without active state
  if (!mounted) {
    return (
      <div className='py-sm sm:py-md px-md sm:px-lg border-tertiary xs:text-lg text-md lg:px-xl xs:gap-4 flex items-center justify-between gap-2 border-b-2 sm:text-xl lg:gap-8'>
        <div className='flex gap-4'>
          {displayedTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setProfileTab(tab)}
              className={cn(
                'py-md w-full cursor-pointer text-lg sm:text-xl',
                selectedTab.value === tab.value
                  ? 'text-primary font-bold opacity-100'
                  : 'font-semibold opacity-50 transition-colors hover:opacity-80'
              )}
            >
              {tab.label}
              {tab.value !== 'activity' && (
                <Label
                  label={getTotalItems(tab)}
                  className={cn(
                    'xs:text-sm sm:text-md xs:min-w-[16px] xs:h-[16px] h-[14px] min-w-[14px] px-0.5! text-xs sm:h-[18px] sm:min-w-[18px]',
                    selectedTab.value === tab.value ? 'bg-primary' : 'bg-neutral'
                  )}
                />
              )}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // After mount, render with proper active state
  return (
    <div className='py-sm sm:py-md px-md sm:px-lg border-tertiary xs:text-lg text-md lg:px-xl xs:gap-4 flex min-h-12 items-center justify-between gap-2 overflow-x-auto border-b-2 sm:text-xl md:min-h-14 md:overflow-x-visible lg:gap-8'>
      <div className='flex min-h-10 gap-4'>
        {displayedTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setProfileTab(tab)}
            className={cn(
              'py-md flex w-full cursor-pointer flex-row items-center justify-center gap-1 text-lg sm:w-fit',
              selectedTab.value === tab.value
                ? 'text-primary font-bold opacity-100'
                : 'font-semibold opacity-50 transition-colors hover:opacity-80'
            )}
          >
            <p className='text-lg text-nowrap sm:text-xl'>{tab.label}</p>
            {tab.value !== 'activity' && (
              <Label
                label={getTotalItems(tab)}
                className={cn(
                  'xs:text-sm sm:text-md xs:min-w-[16px] xs:h-[16px] h-[14px] min-w-[14px] text-xs sm:h-[18px] sm:min-w-[18px]',
                  selectedTab.value === tab.value ? 'bg-primary' : 'bg-neutral'
                )}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

export default TabSwitcher
