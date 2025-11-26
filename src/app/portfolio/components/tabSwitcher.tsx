'use client'

import { portfolioTabs } from '@/constants/domains/portfolio/tabs'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { changeTab, selectUserProfile } from '@/state/reducers/portfolio/profile'
import { cn } from '@/utils/tailwind'
import React, { useEffect, useMemo, useState } from 'react'
import { useDomains } from '../hooks/useDomains'
import { useOffers } from '../hooks/useOffers'
import Label from '@/components/ui/label'

const TabSwitcher = () => {
  const dispatch = useAppDispatch()
  const { selectedTab } = useAppSelector(selectUserProfile)
  const [mounted, setMounted] = useState(false)
  const { totalMyDomains, totalWatchlistDomains } = useDomains()
  const { totalReceivedOffers, totalMyOffers } = useOffers()

  useEffect(() => {
    setMounted(true)
  }, [])

  const getTotalItems = useMemo(
    () => (tab: (typeof portfolioTabs)[number]) => {
      switch (tab.value) {
        case 'domains':
          return totalMyDomains
        case 'watchlist':
          return totalWatchlistDomains
        case 'received_offers':
          return totalReceivedOffers
        case 'my_offers':
          return totalMyOffers
      }
    },
    [totalMyDomains, totalWatchlistDomains, totalReceivedOffers, totalMyOffers]
  )

  // During SSR and initial mount, render all tabs without active state
  if (!mounted) {
    return (
      <div className='py-sm sm:py-md px-md sm:px-lg border-tertiary xs:text-lg text-md lg:px-xl xs:gap-4 flex justify-between gap-2 border-b-2 sm:justify-start sm:text-xl lg:gap-8'>
        {portfolioTabs.map((tab) => {
          const totalItems = getTotalItems(tab)

          return (
            <button
              key={tab.value}
              onClick={() => dispatch(changeTab(tab))}
              className={cn(
                'py-md flex cursor-pointer flex-row items-center gap-1 sm:gap-1.5',
                selectedTab.value === tab.value
                  ? 'border-primary text-primary font-bold opacity-100'
                  : 'font-medium opacity-50 transition-colors hover:opacity-80'
              )}
            >
              <p className='xs:text-md text-sm text-nowrap sm:text-lg'>{tab.label}</p>
              <Label
                label={totalItems}
                className={cn(
                  'xs:text-sm sm:text-md xs:min-w-[16px] xs:h-[16px] h-[14px] min-w-[14px] px-0.5! text-xs sm:h-[18px] sm:min-w-[18px]',
                  selectedTab.value === tab.value ? 'bg-primary' : 'bg-neutral'
                )}
              />
            </button>
          )
        })}
      </div>
    )
  }

  // After mount, render with proper active state
  return (
    <div className='py-sm sm:py-md px-md sm:px-lg border-tertiary xs:text-lg text-md lg:px-xl xs:gap-4 flex justify-between gap-2 border-b-2 sm:justify-start sm:text-xl lg:gap-8'>
      {portfolioTabs.map((tab) => {
        const totalItems = getTotalItems(tab)

        return (
          <button
            key={tab.value}
            onClick={() => dispatch(changeTab(tab))}
            className={cn(
              'py-md flex cursor-pointer flex-row items-center gap-1 sm:gap-1.5',
              selectedTab.value === tab.value
                ? 'border-primary text-primary font-bold opacity-100'
                : 'font-medium opacity-50 transition-colors hover:opacity-80'
            )}
          >
            <p className='xs:text-md text-sm text-nowrap sm:text-lg'>{tab.label}</p>
            <Label
              label={totalItems}
              className={cn(
                'xs:text-sm sm:text-md xs:min-w-[16px] xs:h-[16px] h-[14px] min-w-[14px] px-0.5! text-xs sm:h-[18px] sm:min-w-[18px] sm:px-1!',
                selectedTab.value === tab.value ? 'bg-primary' : 'bg-neutral'
              )}
            />
          </button>
        )
      })}
    </div>
  )
}

export default TabSwitcher
