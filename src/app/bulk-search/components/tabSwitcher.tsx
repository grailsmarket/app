'use client'

import { cn } from '@/utils/tailwind'
import React, { useEffect, useRef, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { changeBulkSearchTab, selectBulkSearch } from '@/state/reducers/bulkSearch/bulkSearch'
import { BULK_SEARCH_TABS, BulkSearchTabType } from '@/constants/domains/bulkSearch/tabs'
import { useNavbar } from '@/context/navbar'
import Image from 'next/image'
import FilterIcon from 'public/icons/filter.svg'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import DownloadButton from '@/components/ui/downloadButton'
import ViewSelector from '@/components/domains/viewSelector'
import { localizeNumber } from '@/utils/localizeNumber'
import { useBulkSearchCounts } from '../hooks/useBulkSearchCounts'
import Label from '@/components/ui/label'

type BulkSearchTabSwitcherProps = {
  activeTabTotal?: number
}

const BulkSearchTabSwitcher: React.FC<BulkSearchTabSwitcherProps> = ({ activeTabTotal }) => {
  const [mounted, setMounted] = useState(false)
  const { selectedTab, searchTerms } = useAppSelector(selectBulkSearch)
  const dispatch = useAppDispatch()
  const { isNavbarVisible } = useNavbar()
  const { selectors, actions } = useFilterRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })
  const counts = useBulkSearchCounts(selectedTab.value, activeTabTotal)

  const setBulkSearchTab = (tab: BulkSearchTabType) => {
    dispatch(changeBulkSearchTab(tab))
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  // Update indicator position when selected tab changes
  useEffect(() => {
    const updateIndicator = () => {
      const container = containerRef.current
      if (!container || !mounted) return

      const activeIndex = BULK_SEARCH_TABS.findIndex((tab) => tab.value === selectedTab.value)
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

  const getTabCount = (tabValue: string): number | undefined => {
    if (!searchTerms) return undefined
    switch (tabValue) {
      case 'names':
        return counts.namesCount
      case 'registered':
        return counts.registeredCount
      case 'grace':
        return counts.graceCount
      case 'premium':
        return counts.premiumCount
      case 'available':
        return counts.availableCount
      default:
        return undefined
    }
  }

  const tabContent = (tab: (typeof BULK_SEARCH_TABS)[number]) => {
    const count = getTabCount(tab.value)
    return (
      <div className='flex items-center gap-1.5'>
        <p className='text-lg text-nowrap sm:text-xl'>{tab.label}</p>
        {count !== undefined && (
          <Label
            label={localizeNumber(count)}
            className={cn(
              'xs:text-sm sm:text-md xs:min-w-[16px] xs:h-[16px] h-[14px] min-w-[14px] px-0.5! text-xs sm:h-[18px] sm:min-w-[18px]',
              selectedTab.value === tab.value ? 'bg-primary' : 'bg-neutral'
            )}
          />
        )}
      </div>
    )
  }

  if (!mounted) {
    return (
      <div
        className={cn(
          'bg-background pr-lg border-tertiary xs:text-lg text-md xs:gap-2 sticky z-10 flex min-h-12 max-w-full items-center justify-between gap-2 overflow-x-auto border-b-2 transition-[top] duration-300 sm:pr-0 sm:text-xl md:min-h-14 lg:gap-4',
          isNavbarVisible ? 'top-14 md:top-[72px]' : 'top-0'
        )}
      >
        <div className='flex items-center justify-between gap-3 md:gap-4'>
          <button
            className='border-tertiary bg-background hover:bg-secondary sticky left-0 z-10 flex h-12 min-h-12 w-12 min-w-12 cursor-pointer items-center justify-center border-r-2 transition-all md:h-14 md:min-h-14 md:w-10 md:min-w-14'
            onClick={() => dispatch(actions.setFiltersOpen(!selectors.filters.open))}
          >
            <Image src={FilterIcon} alt='Filter' width={20} height={20} className='opacity-40' />
          </button>
          <div ref={containerRef} className='relative flex h-10 gap-4'>
            <div
              className='bg-primary absolute bottom-1.5 h-0.5 rounded-full transition-all duration-300 ease-out'
              style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
            />
            {BULK_SEARCH_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setBulkSearchTab(tab)}
                className={cn(
                  'py-md flex w-full cursor-pointer flex-row items-center justify-center gap-1 text-lg sm:w-fit',
                  selectedTab.value === tab.value
                    ? 'text-primary font-bold opacity-100'
                    : 'font-semibold opacity-50 transition-colors hover:opacity-80'
                )}
              >
                {tabContent(tab)}
              </button>
            ))}
          </div>
        </div>
        <div className='hidden items-center md:flex'>
          <DownloadButton />
          <ViewSelector />
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'bg-background pr-lg border-tertiary xs:text-lg text-md xs:gap-2 sticky z-10 flex min-h-12 max-w-full items-center justify-between gap-2 overflow-x-auto border-b-2 transition-[top] duration-300 sm:pr-0 sm:text-xl md:min-h-14 lg:gap-4',
        isNavbarVisible ? 'top-14 md:top-[72px]' : 'top-0'
      )}
    >
      <div className='flex items-center justify-between gap-3 md:gap-4'>
        <button
          className='border-tertiary bg-background hover:bg-secondary sticky left-0 z-10 flex h-12 min-h-12 w-12 min-w-12 cursor-pointer items-center justify-center border-r-2 transition-all md:h-14 md:min-h-14 md:w-10 md:min-w-14'
          onClick={() => dispatch(actions.setFiltersOpen(!selectors.filters.open))}
        >
          <Image src={FilterIcon} alt='Filter' width={20} height={20} className='opacity-40' />
        </button>
        <div ref={containerRef} className='relative flex h-10 gap-4'>
          <div
            className='bg-primary absolute bottom-1.5 h-0.5 rounded-full transition-all duration-300 ease-out'
            style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
          />
          {BULK_SEARCH_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setBulkSearchTab(tab)}
              className={cn(
                'py-md flex w-full cursor-pointer flex-row items-center justify-center gap-1 text-lg sm:w-fit',
                selectedTab.value === tab.value
                  ? 'text-primary font-bold opacity-100'
                  : 'font-semibold opacity-50 transition-colors hover:opacity-80'
              )}
            >
              {tabContent(tab)}
            </button>
          ))}
        </div>
      </div>
      <div className='hidden items-center md:flex'>
        <DownloadButton />
        <ViewSelector />
      </div>
    </div>
  )
}

export default BulkSearchTabSwitcher
