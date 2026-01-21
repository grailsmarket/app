'use client'

import { cn } from '@/utils/tailwind'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { changeCategoryTab, CategoryTabType, selectCategory } from '@/state/reducers/category/category'
import { CATEGORY_TABS } from '@/constants/domains/category/tabs'
import { useNavbar } from '@/context/navbar'
import { useCategories } from '@/components/filters/hooks/useCategories'
import Label from '@/components/ui/label'
import { formatTotalTabItems } from '@/utils/formatTabItems'

interface Props {
  category: string
}

const TabSwitcher: React.FC<Props> = ({ category }) => {
  const [mounted, setMounted] = useState(false)
  const { selectedTab } = useAppSelector(selectCategory)
  const dispatch = useAppDispatch()
  const { isNavbarVisible } = useNavbar()
  const { categories: allCategories } = useCategories()
  const categoryDetails = allCategories?.find((item) => item.name === category)

  const containerRef = useRef<HTMLDivElement>(null)
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })

  const setCategoryTab = (tab: CategoryTabType) => {
    dispatch(changeCategoryTab(tab))
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  // Update indicator position when selected tab changes
  useEffect(() => {
    const updateIndicator = () => {
      const container = containerRef.current
      if (!container || !mounted) return

      const activeIndex = CATEGORY_TABS.findIndex((tab) => tab.value === selectedTab.value)
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

  const getTotalItems = useMemo(
    () => (tab: (typeof CATEGORY_TABS)[number]) => {
      switch (tab.value) {
        case 'names':
          return formatTotalTabItems(categoryDetails?.member_count || 0)
        case 'premium':
          return formatTotalTabItems(categoryDetails?.premium_count || 0)
        case 'available':
          return formatTotalTabItems(categoryDetails?.available_count || 0)
      }
    },
    [categoryDetails]
  )

  // During SSR and initial mount, render all tabs without active state
  if (!mounted) {
    return (
      <div
        className={cn(
          'bg-background px-md md:px-lg border-tertiary xs:text-lg text-md lg:px-xl xs:gap-4 sticky z-20 flex min-h-12 items-center justify-between gap-2 overflow-x-auto border-b-2 transition-[top] duration-300 sm:text-xl md:min-h-14 md:overflow-x-visible lg:gap-8',
          isNavbarVisible ? 'top-14 md:top-[72px]' : 'top-0'
        )}
      >
        <div ref={containerRef} className='relative flex h-10 gap-4'>
          <div
            className='bg-primary absolute bottom-1 h-0.5 rounded-full transition-all duration-300 ease-out'
            style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
          />
          <div className='flex gap-4'>
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setCategoryTab(tab)}
                className={cn(
                  'py-md flex w-full cursor-pointer flex-row items-center justify-center gap-1 text-lg sm:text-xl',
                  selectedTab.value === tab.value
                    ? 'text-primary font-bold opacity-100'
                    : 'font-semibold opacity-50 transition-colors hover:opacity-80'
                )}
              >
                <p>{tab.label}</p>
                {tab.value !== 'activity' && (
                  <Label
                    label={getTotalItems(tab)}
                    className={cn(
                      'xs:text-sm sm:text-md xs:min-w-[16px] xs:h-[16px] h-[14px] min-w-[14px] px-0.5! text-xs sm:h-[18px] sm:min-w-[18px]',
                      selectedTab.value === tab.value ? 'bg-primary' : 'bg-neutral'
                    )}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // After mount, render with proper active state
  return (
    <div
      className={cn(
        'bg-background px-md md:px-lg border-tertiary xs:text-lg text-md lg:px-xl xs:gap-4 sticky z-20 flex min-h-12 items-center justify-between gap-2 overflow-x-auto border-b-2 transition-[top] duration-300 sm:text-xl md:min-h-14 md:overflow-x-visible lg:gap-8',
        isNavbarVisible ? 'top-14 md:top-[72px]' : 'top-0'
      )}
    >
      <div ref={containerRef} className='relative flex h-10 gap-4'>
        <div
          className='bg-primary absolute bottom-1 h-0.5 rounded-full transition-all duration-300 ease-out'
          style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
        />
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setCategoryTab(tab)}
            className={cn(
              'py-md flex w-full cursor-pointer flex-row items-center justify-center gap-1 text-lg sm:text-xl',
              selectedTab.value === tab.value
                ? 'text-primary font-bold opacity-100'
                : 'font-semibold opacity-50 transition-colors hover:opacity-80'
            )}
          >
            <p>{tab.label}</p>
            {tab.value !== 'activity' && (
              <Label
                label={getTotalItems(tab)}
                className={cn(
                  'xs:text-sm sm:text-md xs:min-w-[16px] xs:h-[16px] h-[14px] min-w-[14px] px-0.5! text-xs sm:h-[18px] sm:min-w-[18px]',
                  selectedTab.value === tab.value ? 'bg-primary' : 'bg-neutral'
                )}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

export default TabSwitcher
