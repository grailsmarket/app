'use client'

import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/utils/tailwind'
import FilterIcon from 'public/icons/filter.svg'
import { FEED_TABS } from '@/constants/filters/feed'
import type { FeedTabValue } from '@/types/filters/feed'

interface FeedFiltersProps {
  selectedTab: FeedTabValue
  onTabChange: (tab: FeedTabValue) => void
  selectedFilterCount: number
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

  return (
    <div className='bg-background border-tertiary xs:text-lg text-md xs:gap-2 sticky top-0 z-20 flex min-h-12 max-w-full items-center gap-3 overflow-x-auto border-b-2 transition-[top] duration-300 sm:text-xl md:min-h-14 lg:gap-4'>
      <button
        type='button'
        onClick={onToggleFilters}
        className='border-tertiary bg-background hover:bg-secondary sticky left-0 z-10 flex h-12 min-h-12 w-12 min-w-12 cursor-pointer items-center justify-center border-r-2 transition-all md:h-14 md:min-h-14 md:w-10 md:min-w-14'
        aria-label='Toggle filters'
      >
        <Image src={FilterIcon} alt='Filter' width={20} height={20} className='opacity-40' />
        {selectedFilterCount > 0 && (
          <span className='bg-primary text-background absolute top-1 right-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-bold'>
            {selectedFilterCount}
          </span>
        )}
      </button>
      <div ref={containerRef} className='relative flex h-10 gap-4'>
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
              'py-md flex w-full cursor-pointer flex-row items-center justify-center gap-1 text-lg sm:w-fit',
              selectedTab === tab.value
                ? 'text-primary font-bold opacity-100'
                : 'font-semibold opacity-50 transition-colors hover:opacity-80'
            )}
          >
            <p className='text-lg text-nowrap sm:text-xl'>{tab.label}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

export default FeedFilters
