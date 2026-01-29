'use client'

import { cn } from '@/utils/tailwind'
import React, { useEffect, useRef, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { changeMarketplaceTab, MarketplaceTabType, selectMarketplace } from '@/state/reducers/marketplace/marketplace'
import { MARKETPLACE_TABS } from '@/constants/domains/marketplace/tabs'
import { useNavbar } from '@/context/navbar'
import Image from 'next/image'
import FilterIcon from 'public/icons/filter.svg'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import DownloadButton from '@/components/ui/downloadButton'
import ViewSelector from '@/components/domains/viewSelector'

interface MarketplaceTabSwitcherProps {
  isLiveActivityConnected: boolean
}

const MarketplaceTabSwitcher: React.FC<MarketplaceTabSwitcherProps> = () => {
  const [mounted, setMounted] = useState(false)
  const { selectedTab } = useAppSelector(selectMarketplace)
  const dispatch = useAppDispatch()
  const { isNavbarVisible } = useNavbar()
  const { selectors, actions } = useFilterRouter()
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
      <div
        className={cn(
          'bg-background px-sm sm:px-md md:px-lg border-tertiary xs:text-lg text-md lg:px-lg xs:gap-2 sticky z-10 flex min-h-12 max-w-full items-center justify-between gap-2 overflow-x-auto border-b-2 transition-[top] duration-300 sm:text-xl md:min-h-14 lg:gap-4',
          isNavbarVisible ? 'top-14 md:top-[72px]' : 'top-0'
        )}
      >
        <div className='flex items-center justify-between gap-3 md:gap-4'>
          <button
            className='border-foreground flex h-9 min-h-9 w-9 min-w-9 cursor-pointer items-center justify-center rounded-sm border opacity-30 transition-opacity hover:opacity-80 md:h-10 md:min-h-10 md:w-10 md:min-w-10'
            onClick={() => dispatch(actions.setFiltersOpen(!selectors.filters.open))}
          >
            <Image src={FilterIcon} alt='Filter' width={16} height={16} />
          </button>
          <div ref={containerRef} className='relative flex h-10 gap-4'>
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
        </div>
        <div className='hidden items-center gap-2 md:flex'>
          {selectedTab.value !== 'activity' && <DownloadButton />}
          {selectedTab.value !== 'activity' && <ViewSelector />}
        </div>
      </div>
    )
  }

  // After mount, render with proper active state
  return (
    <div
      className={cn(
        'bg-background px-sm sm:px-md md:px-lg border-tertiary xs:text-lg text-md lg:px-lg xs:gap-2 sticky z-10 flex min-h-12 max-w-full items-center justify-between gap-2 overflow-x-auto border-b-2 transition-[top] duration-300 sm:text-xl md:min-h-14 lg:gap-4',
        isNavbarVisible ? 'top-14 md:top-[72px]' : 'top-0'
      )}
    >
      <div className='flex items-center justify-between gap-3 md:gap-4'>
        <button
          className='border-foreground flex h-9 min-h-9 w-9 min-w-9 cursor-pointer items-center justify-center rounded-sm border opacity-30 transition-opacity hover:opacity-80 md:h-10 md:min-h-10 md:w-10 md:min-w-10'
          onClick={() => dispatch(actions.setFiltersOpen(!selectors.filters.open))}
        >
          <Image src={FilterIcon} alt='Filter' width={16} height={16} />
        </button>
        <div ref={containerRef} className='relative flex h-10 gap-4'>
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
      </div>
      <div className='hidden items-center gap-2 md:flex'>
        {selectedTab.value !== 'activity' && <DownloadButton />}
        {selectedTab.value !== 'activity' && <ViewSelector />}
      </div>
      {/* {selectedTab.value === 'activity' && (
        <div className='hidden items-center justify-end gap-1 sm:gap-2 lg:flex'>
          <div
            className={`h-2.5 w-2.5 animate-pulse rounded-full ${isLiveActivityConnected ? 'bg-green-500' : 'bg-red-500'}`}
          ></div>
          <span className='text-md text-right font-medium sm:text-lg'>
            {isLiveActivityConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      )} */}
    </div>
  )
}

export default MarketplaceTabSwitcher
