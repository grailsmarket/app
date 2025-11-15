'use client'

import { portfolioTabs } from '@/constants/domains/portfolio/tabs'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { changeTab, selectUserProfile } from '@/state/reducers/portfolio/profile'
import { cn } from '@/utils/tailwind'
import React, { useEffect, useState } from 'react'

const TabSwitcher = () => {
  const dispatch = useAppDispatch()
  const { selectedTab } = useAppSelector(selectUserProfile)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // During SSR and initial mount, render all tabs without active state
  if (!mounted) {
    return (
      <div className='py-sm sm:py-md px-lg border-tertiary xs:text-lg text-md lg:px-xl flex justify-between gap-4 border-b-2 sm:justify-start sm:text-xl lg:gap-6'>
        {portfolioTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => dispatch(changeTab(tab))}
            className={cn(
              'py-md cursor-pointer',
              selectedTab.value === tab.value
                ? 'border-primary text-primary font-bold opacity-100'
                : 'font-medium opacity-50 transition-colors hover:opacity-80'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    )
  }

  // After mount, render with proper active state
  return (
    <div className='py-sm sm:py-md px-lg border-tertiary xs:text-lg text-md lg:px-xl flex justify-between gap-4 border-b-2 sm:justify-start sm:text-xl lg:gap-6'>
      {portfolioTabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => dispatch(changeTab(tab))}
          className={cn(
            'py-md cursor-pointer',
            selectedTab.value === tab.value
              ? 'border-primary text-primary font-bold opacity-100'
              : 'font-medium opacity-50 transition-colors hover:opacity-80'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

export default TabSwitcher
