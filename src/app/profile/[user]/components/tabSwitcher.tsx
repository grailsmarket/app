'use client'

import { profileTabs } from '@/constants/domains/profile/tabs'
import { ProfileTabType } from '@/types/filters'
import { cn } from '@/utils/tailwind'
import React, { useEffect, useState } from 'react'

interface TabSwitcherProps {
  profileTab: ProfileTabType
  setProfileTab: (tab: ProfileTabType) => void
}

const TabSwitcher: React.FC<TabSwitcherProps> = ({ profileTab, setProfileTab }) => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // During SSR and initial mount, render all tabs without active state
  if (!mounted) {
    return (
      <div className='px-md py-md md:px-lg border-tertiary flex gap-4 border-b-2'>
        {profileTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setProfileTab(tab.value)}
            className={cn(
              'py-md w-full cursor-pointer text-lg sm:text-xl',
              profileTab === tab.value
                ? 'text-primary font-bold opacity-100'
                : 'font-semibold opacity-50 transition-colors hover:opacity-80'
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
    <div className='px-md py-0.5 md:py-md md:px-xl border-tertiary flex gap-4 border-b-2'>
      {profileTabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => setProfileTab(tab.value)}
          className={cn(
            'py-md w-full cursor-pointer text-lg sm:w-fit sm:text-xl',
            profileTab === tab.value
              ? 'text-primary font-bold opacity-100'
              : 'font-semibold opacity-50 transition-colors hover:opacity-80'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

export default TabSwitcher
