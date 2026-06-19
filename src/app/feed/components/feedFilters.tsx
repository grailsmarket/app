'use client'

import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/utils/tailwind'
import FilterIcon from 'public/icons/filter.svg'
import { FEED_TABS } from '@/constants/filters/feed'
import MobileTabDropdown from '@/components/ui/mobileTabDropdown'
import type { FeedTabValue } from '@/types/filters/feed'

interface FeedFiltersProps {
  selectedTab: FeedTabValue
  onTabChange: (tab: FeedTabValue) => void
  selectedFilterCount: number
  filtersOpen: boolean
  onToggleFilters: () => void
}

const FeedFilters: React.FC<FeedFiltersProps> = ({
  selectedTab,
  onTabChange,
  selectedFilterCount,
  onToggleFilters,
}) => {
  const [mounted, setMounted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const updateIndicator = () => {
      const container = containerRef.current
      if (!container || !mounted) return

      const activeIndex = FEED_TABS.findIndex((tab) => tab.value === selectedTab)
      const activeButton = container.querySelectorAll('button')[activeIndex] as HTMLElement | undefined
      if (!activeButton) return

      setIndicatorStyle({ left: activeButton.offsetLeft, width: activeButton.offsetWidth })
    }

    updateIndicator()
    window.addEventListener('resize', updateIndicator)
    return () => window.removeEventListener('resize', updateIndicator)
  }, [selectedTab, mounted])
  const renderTabLabel = (tab: (typeof FEED_TABS)[number]) => (
    <p className='text-lg text-nowrap @[40rem]/app:text-xl'>{tab.label}</p>
  )

  return (
    <div className='bg-background border-tertiary text-md @[48rem]/app:touch-scroll-x sticky top-0 z-20 flex min-h-12 max-w-full items-center gap-3 border-b-2 transition-[top] duration-300 @[26.25rem]/app:text-lg @[40rem]/app:gap-4 @[40rem]/app:text-xl @[48rem]/app:min-h-14 @[48rem]/app:scrollbar-none @[48rem]/app:overflow-x-auto @[64rem]/app:gap-4'>
      <div className='flex w-full items-center @[48rem]/app:w-auto @[48rem]/app:gap-4'>
        <button
          type='button'
          onClick={onToggleFilters}
          className='border-tertiary bg-background hover:bg-secondary sticky left-0 z-10 flex h-12 min-h-12 w-12 min-w-12 cursor-pointer items-center justify-center border-r-2 transition-all @[48rem]/app:h-14 @[48rem]/app:min-h-14 @[48rem]/app:w-10 @[48rem]/app:min-w-14'
          aria-label='Toggle filters'
        >
          <Image
            src={FilterIcon}
            alt='Filter'
            width={20}
            height={20}
            className={cn('transition-transform duration-200')}
          />
          {selectedFilterCount > 0 && (
            <span className='bg-primary text-background absolute top-1 right-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-bold'>
              {selectedFilterCount}
            </span>
          )}
        </button>

        <div className='flex-1 @[48rem]/app:hidden'>
          <MobileTabDropdown
            options={FEED_TABS.map((tab) => ({
              value: tab.value,
              label: renderTabLabel(tab),
              onClick: () => onTabChange(tab.value),
            }))}
            value={selectedTab}
          />
        </div>

        <div ref={containerRef} className='relative hidden h-10 min-w-max gap-4 pr-4 @[48rem]/app:flex'>
          {mounted && (
            <div
              className='bg-primary absolute bottom-1.5 h-0.5 rounded-full transition-all duration-300 ease-out'
              style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
            />
          )}
          {FEED_TABS.map((tab) => (
            <button
              key={tab.value}
              type='button'
              onClick={() => onTabChange(tab.value)}
              className={cn(
                'py-md flex w-fit shrink-0 cursor-pointer flex-row items-center justify-center gap-1 text-lg',
                selectedTab === tab.value
                  ? 'text-primary font-bold opacity-100'
                  : 'font-semibold opacity-50 transition-colors hover:opacity-80'
              )}
            >
              {renderTabLabel(tab)}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default FeedFilters
