'use client'

import { cn } from '@/utils/tailwind'
import React, { useEffect, useRef, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { changeMarketplaceTab, MarketplaceTabType, selectMarketplace } from '@/state/reducers/marketplace/marketplace'
import { MARKETPLACE_TABS } from '@/constants/domains/marketplace/tabs'

interface MarketplaceTabSwitcherProps {
  isLiveActivityConnected: boolean
}

const MarketplaceTabSwitcher: React.FC<MarketplaceTabSwitcherProps> = ({ isLiveActivityConnected }) => {
  const [mounted, setMounted] = useState(false)
  const { selectedTab } = useAppSelector(selectMarketplace)
  const dispatch = useAppDispatch()

  const containerRef = useRef<HTMLDivElement>(null)
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })

  const setMarketplaceTab = (tab: MarketplaceTabType) => {
    dispatch(changeMarketplaceTab(tab))
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  // Update indicator position when selected tab changes
  useEffect(() => {
    const updateIndicator = () => {
      const container = containerRef.current
      if (!container || !mounted) return

      const activeIndex = MARKETPLACE_TABS.findIndex((tab) => tab.value === selectedTab.value)
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
  }, [selectedTab, mounted])

  // During SSR and initial mount, render without active state
  if (!mounted) {
    return (
      <div className='bg-background px-md sm:px-lg border-tertiary xs:text-lg text-md lg:px-xl xs:gap-4 sticky top-14 z-10 flex min-h-12 items-center gap-2 border-b-2 sm:text-xl md:top-[70px] md:min-h-14 lg:gap-8'>
        <div ref={containerRef} className='relative flex h-10 w-full justify-between gap-4'>
          <div
            className='bg-primary absolute bottom-1.5 h-0.5 rounded-full transition-all duration-300 ease-out'
            style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
          />
          <div className='flex gap-4'>
            {MARKETPLACE_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setMarketplaceTab(tab)}
                className={cn(
                  'py-md w-full cursor-pointer text-lg sm:text-xl',
                  selectedTab.value === tab.value
                    ? 'text-primary font-bold opacity-100'
                    : 'font-semibold opacity-50 transition-colors hover:opacity-80'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className='flex items-center justify-end gap-1 sm:gap-2'>
            <div
              className={`h-2.5 w-2.5 animate-pulse rounded-full ${isLiveActivityConnected ? 'bg-green-500' : 'bg-red-500'}`}
            ></div>
            <span className='text-md text-right font-medium sm:text-lg'>
              {isLiveActivityConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>
    )
  }

  // After mount, render with proper active state
  return (
    <div className='bg-background px-md sm:px-lg border-tertiary xs:text-lg text-md lg:px-xl xs:gap-4 sticky top-0 z-20 flex min-h-12 items-center gap-2 border-b-2 sm:text-xl md:top-[70px] md:min-h-14 lg:gap-8'>
      <div ref={containerRef} className='relative flex h-10 gap-4 lg:w-full'>
        <div
          className='bg-primary absolute bottom-1.5 h-0.5 rounded-full transition-all duration-300 ease-out'
          style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
        />
        {MARKETPLACE_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setMarketplaceTab(tab)}
            className={cn(
              'py-md flex w-full cursor-pointer flex-row items-center justify-center gap-1 text-lg sm:w-fit',
              selectedTab.value === tab.value
                ? 'text-primary font-bold opacity-100'
                : 'font-semibold opacity-50 transition-colors hover:opacity-80'
            )}
          >
            <p className='text-lg text-nowrap sm:text-xl'>{tab.label}</p>
          </button>
        ))}
      </div>
      {selectedTab.value === 'activity' && (
        <div className='hidden items-center justify-end gap-1 sm:gap-2 lg:flex'>
          <div
            className={`h-2.5 w-2.5 animate-pulse rounded-full ${isLiveActivityConnected ? 'bg-green-500' : 'bg-red-500'}`}
          ></div>
          <span className='text-md text-right font-medium sm:text-lg'>
            {isLiveActivityConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      )}
    </div>
  )
}

export default MarketplaceTabSwitcher
