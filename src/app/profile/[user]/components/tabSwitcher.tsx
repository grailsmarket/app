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
      <div className='px-lg flex gap-4'>
        {profileTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setProfileTab(tab.value)}
            className='py-md cursor-pointer font-medium opacity-50 transition-colors hover:opacity-80'
          >
            {tab.label}
          </button>
        ))}
      </div>
    )
  }

  // After mount, render with proper active state
  return (
    <div className='px-lg flex gap-4'>
      {profileTabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => setProfileTab(tab.value)}
          className={cn(
            'py-md cursor-pointer',
            profileTab === tab.value
              ? 'border-primary border-b-[1px] font-bold opacity-100'
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
