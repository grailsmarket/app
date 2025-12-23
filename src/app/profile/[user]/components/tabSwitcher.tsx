'use client'

import { cn } from '@/utils/tailwind'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Address } from 'viem/accounts'
import Label from '@/components/ui/label'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { changeTab, ProfileTabType, selectUserProfile } from '@/state/reducers/portfolio/profile'
import { PROFILE_TABS } from '@/constants/domains/portfolio/tabs'
import { useUserContext } from '@/context/user'
import { useOffers } from '../hooks/useOffers'
import { useDomains } from '../hooks/useDomains'
import { useNavbar } from '@/context/navbar'

interface TabSwitcherProps {
  user: Address | undefined
}

const TabSwitcher: React.FC<TabSwitcherProps> = ({ user }) => {
  const [mounted, setMounted] = useState(false)
  const { userAddress, authStatus } = useUserContext()
  const { selectedTab } = useAppSelector(selectUserProfile)
  const dispatch = useAppDispatch()
  const { profileTotalDomains, totalWatchlistDomains, totalListings } = useDomains(user)
  const { totalReceivedOffers, totalSentOffers } = useOffers(user)
  const { isNavbarVisible } = useNavbar()

  const containerRef = useRef<HTMLDivElement>(null)
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })

  const setProfileTab = (tab: ProfileTabType) => {
    dispatch(changeTab(tab))
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  const displayedTabs = useMemo(() => {
    if (user && userAddress && user.toLowerCase() === userAddress.toLowerCase() && authStatus === 'authenticated') {
      return PROFILE_TABS
    }

    return PROFILE_TABS.filter((tab) => tab.value !== 'watchlist')
  }, [authStatus, user, userAddress])

  const getTotalItems = useMemo(
    () => (tab: (typeof PROFILE_TABS)[number]) => {
      switch (tab.value) {
        case 'domains':
          return profileTotalDomains
        case 'listings':
          return totalListings
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
    [profileTotalDomains, totalWatchlistDomains, totalReceivedOffers, totalSentOffers, totalListings]
  )

  // Update indicator position when selected tab changes
  useEffect(() => {
    const updateIndicator = () => {
      const container = containerRef.current
      if (!container || !mounted) return

      const activeIndex = displayedTabs.findIndex((tab) => tab.value === selectedTab.value)
      if (activeIndex === -1) {
        setIndicatorStyle({ left: 0, width: 0 })
        return
      }

      const buttons = container.querySelectorAll('button')
      const activeButton = buttons[activeIndex] as HTMLElement
      if (activeButton) {
        setIndicatorStyle({
          left: activeButton.offsetLeft,
          width: activeButton.offsetWidth,
        })
      }
    }

    updateIndicator()
    window.addEventListener('resize', updateIndicator)
    return () => window.removeEventListener('resize', updateIndicator)
  }, [selectedTab, mounted, displayedTabs])

  // During SSR and initial mount, render all tabs without active state
  if (!mounted) {
    return (
      <div
        className={cn(
          'bg-background px-md sm:px-lg border-tertiary xs:text-lg text-md lg:px-xl xs:gap-4 sticky z-10 flex min-h-12 items-center justify-between gap-2 overflow-x-auto border-b-2 transition-[top] duration-300 sm:text-xl md:top-[70px] md:min-h-14 md:overflow-x-visible lg:gap-8',
          isNavbarVisible ? 'top-14' : 'top-0'
        )}
      >
        <div ref={containerRef} className='relative flex h-10 gap-4'>
          <div
            className='bg-primary absolute bottom-1 h-0.5 rounded-full transition-all duration-300 ease-out'
            style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
          />
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
      </div>
    )
  }

  // After mount, render with proper active state
  return (
    <div
      className={cn(
        'bg-background px-md sm:px-lg border-tertiary xs:text-lg text-md lg:px-xl xs:gap-4 sticky z-10 flex min-h-12 items-center justify-between gap-2 overflow-x-auto border-b-2 transition-[top] duration-300 sm:text-xl md:top-[70px] md:min-h-14 md:overflow-x-visible lg:gap-8',
        isNavbarVisible ? 'top-14' : 'top-0'
      )}
    >
      <div ref={containerRef} className='relative flex h-10 gap-4'>
        <div
          className='bg-primary absolute bottom-1 h-0.5 rounded-full transition-all duration-300 ease-out'
          style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
        />
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
