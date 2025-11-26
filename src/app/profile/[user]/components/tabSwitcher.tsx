'use client'

import { profileTabs } from '@/constants/domains/profile/tabs'
import { ProfileTabType } from '@/types/filters'
import { cn } from '@/utils/tailwind'
import React, { useEffect, useState } from 'react'
import { useProfileDomains } from '../hooks/useDomains'
import { Address } from 'viem/accounts'
import Label from '@/components/ui/label'

interface TabSwitcherProps {
  profileTab: ProfileTabType
  user: Address | string
  setProfileTab: (tab: ProfileTabType) => void
}

const TabSwitcher: React.FC<TabSwitcherProps> = ({ profileTab, setProfileTab, user }) => {
  const [mounted, setMounted] = useState(false)
  const { totalDomains } = useProfileDomains(user)

  useEffect(() => {
    setMounted(true)
  }, [])

  // During SSR and initial mount, render all tabs without active state
  if (!mounted) {
    return (
      <div className='px-md py-md md:px-lg border-tertiary flex w-full gap-4 border-b-2'>
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
            {tab.value === 'domains' && (
              <Label
                label={totalDomains}
                className={cn(
                  'xs:text-sm sm:text-md xs:min-w-[16px] xs:h-[16px] h-[14px] min-w-[14px] px-0.5! text-xs sm:h-[18px] sm:min-w-[18px]',
                  profileTab === tab.value ? 'bg-primary' : 'bg-neutral'
                )}
              />
            )}
          </button>
        ))}
      </div>
    )
  }

  // After mount, render with proper active state
  return (
    <div className='px-md md:py-md md:px-xl border-tertiary flex w-full gap-4 border-b-2 py-0.5'>
      {profileTabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => setProfileTab(tab.value)}
          className={cn(
            'py-md flex w-full cursor-pointer flex-row items-center justify-center gap-1 text-lg sm:w-fit',
            profileTab === tab.value
              ? 'text-primary font-bold opacity-100'
              : 'font-semibold opacity-50 transition-colors hover:opacity-80'
          )}
        >
          <p className='text-lg text-nowrap sm:text-xl'>{tab.label}</p>
          {tab.value === 'domains' && (
            <Label
              label={totalDomains}
              className={cn(
                'xs:text-sm sm:text-md xs:min-w-[16px] xs:h-[16px] h-[14px] min-w-[14px] text-xs sm:h-[18px] sm:min-w-[18px]',
                profileTab === tab.value ? 'bg-primary' : 'bg-neutral'
              )}
            />
          )}
        </button>
      ))}
    </div>
  )
}

export default TabSwitcher
