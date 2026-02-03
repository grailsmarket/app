'use client'

import { cn } from '@/utils/tailwind'
import React, { useEffect, useRef, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { changeCategoriesPageTab, selectCategoriesPage } from '@/state/reducers/categoriesPage/categoriesPage'
import { CATEGORIES_PAGE_TABS, CategoriesPageTabType } from '@/constants/categories/categoriesPageTabs'
import { useNavbar } from '@/context/navbar'
import { useRouter } from 'next/navigation'
import { useAllHoldersCount } from '../hooks/useAllHolders'
import { useCategoriesListingsCount } from '../hooks/useCategoriesListingsCount'
import Label from '@/components/ui/label'
import { formatTotalTabItems } from '@/utils/formatTabItems'
import { localizeNumber } from '@/utils/localizeNumber'
import DownloadButton from '@/components/ui/downloadButton'
import Image from 'next/image'
import FilterIcon from 'public/icons/filter.svg'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import ViewSelector from '@/components/domains/viewSelector'
import { useCategories } from '@/components/filters/hooks/useCategories'
import { setBulkSelectIsSelecting } from '@/state/reducers/modals/bulkSelectModal'

const CategoriesPageTabSwitcher: React.FC = () => {
  const [mounted, setMounted] = useState(false)
  const { categoriesPage } = useAppSelector(selectCategoriesPage)
  const { selectedTab } = categoriesPage
  const dispatch = useAppDispatch()
  const { isNavbarVisible } = useNavbar()
  const router = useRouter()
  const { categories } = useCategories()
  const { data: holdersCount } = useAllHoldersCount()
  const { data: listingsCount } = useCategoriesListingsCount()
  const { selectors, actions } = useFilterRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })

  const setCategoriesPageTab = (tab: CategoriesPageTabType) => {
    dispatch(changeCategoriesPageTab(tab))
    // Update URL when switching tabs - clear params and set new tab
    if (tab.value === 'categories') {
      // Default tab - clear all URL params
      router.push('/categories')
    } else {
      // Non-default tab - set tab param only, clearing other filters
      router.push(`/categories?tab=${tab.value}`)
    }
    dispatch(setBulkSelectIsSelecting(false))
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  // Update indicator position when selected tab changes
  useEffect(() => {
    const updateIndicator = () => {
      const container = containerRef.current
      if (!container || !mounted) return

      const activeIndex = CATEGORIES_PAGE_TABS.findIndex((tab) => tab.value === selectedTab.value)
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
  }, [selectedTab, mounted, holdersCount, listingsCount])

  // During SSR and initial mount, render without active state
  if (!mounted) {
    return (
      <div
        className={cn(
          'bg-background px-md md:px-lg border-tertiary xs:text-lg text-md lg:px-xl xs:gap-4 sticky z-10 flex min-h-12 items-center gap-2 border-b-2 transition-[top] duration-300 sm:text-xl md:min-h-14 lg:gap-8',
          isNavbarVisible ? 'top-14 md:top-[70px]' : 'top-0'
        )}
      >
        <div className='flex items-center justify-between gap-3 md:gap-4'>
          <button
            className='border-foreground flex h-9 min-h-9 w-9 min-w-9 cursor-pointer items-center justify-center rounded-sm border opacity-30 transition-opacity hover:opacity-80 md:h-10 md:min-h-10 md:w-10 md:min-w-10'
            onClick={() => dispatch(actions.setFiltersOpen(!selectors.filters.open))}
          >
            <Image src={FilterIcon} alt='Filter' width={16} height={16} />
          </button>
          <div ref={containerRef} className='relative flex h-10 w-full gap-4'>
            <div
              className='bg-primary absolute bottom-1.5 h-0.5 rounded-full transition-all duration-300 ease-out'
              style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
            />
            <div className='flex gap-4'>
              {CATEGORIES_PAGE_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setCategoriesPageTab(tab)}
                  className={cn(
                    'py-md flex w-full cursor-pointer flex-row items-center justify-center gap-1 text-lg sm:text-xl',
                    selectedTab.value === tab.value
                      ? 'text-primary font-bold opacity-100'
                      : 'font-medium opacity-50 transition-colors hover:opacity-80'
                  )}
                >
                  <p>{tab.label}</p>
                  {tab.value === 'holders' && (
                    <Label
                      label={formatTotalTabItems(holdersCount || 0)}
                      className={cn(
                        'xs:text-sm sm:text-md xs:min-w-[16px] xs:h-[16px] h-[14px] min-w-[14px] px-0.5! text-xs sm:h-[18px] sm:min-w-[18px]',
                        selectedTab.value === tab.value ? 'bg-primary' : 'bg-neutral'
                      )}
                    />
                  )}
                  {tab.value === 'listings' && (
                    <Label
                      label={formatTotalTabItems(listingsCount || 0)}
                      className={cn(
                        'xs:text-sm sm:text-md xs:min-w-[16px] xs:h-[16px] h-[14px] min-w-[14px] px-0.5! text-xs sm:h-[18px] sm:min-w-[18px]',
                        selectedTab.value === tab.value ? 'bg-primary' : 'bg-neutral'
                      )}
                    />
                  )}
                  {tab.value === 'categories' && (
                    <Label
                      label={categories?.length || 0}
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
        <div className='hidden items-center gap-2 md:flex'>
          {selectedTab.value !== 'categories' && selectedTab.value !== 'holders' && <DownloadButton />}
          {selectedTab.value !== 'categories' && selectedTab.value !== 'holders' && <ViewSelector />}
        </div>
      </div>
    )
  }

  // After mount, render with proper active state
  return (
    <div
      className={cn(
        'bg-background px-sm sm:px-md md:px-lg border-tertiary xs:text-lg text-md xs:gap-4 sticky z-10 flex min-h-12 max-w-full items-center justify-between gap-2 overflow-x-auto border-b-2 transition-[top] duration-300 sm:text-xl md:min-h-14 lg:gap-8',
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
        <div ref={containerRef} className='relative flex h-10 gap-4 lg:w-full'>
          <div
            className='bg-primary absolute bottom-1.5 h-0.5 rounded-full transition-all duration-300 ease-out'
            style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
          />
          {CATEGORIES_PAGE_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setCategoriesPageTab(tab)}
              className={cn(
                'py-md flex w-full cursor-pointer flex-row items-center justify-center gap-1 text-lg sm:w-fit',
                selectedTab.value === tab.value
                  ? 'text-primary font-bold opacity-100'
                  : 'font-medium opacity-50 transition-colors hover:opacity-80'
              )}
            >
              <p className='text-lg text-nowrap sm:text-xl'>{tab.label}</p>
              {tab.value === 'holders' && (
                <Label
                  label={localizeNumber(holdersCount || 0)}
                  className={cn(
                    'xs:text-sm sm:text-md xs:min-w-[16px] xs:h-[16px] h-[14px] min-w-[14px] px-0.5! text-xs sm:h-[18px] sm:min-w-[18px]',
                    selectedTab.value === tab.value ? 'bg-primary' : 'bg-neutral'
                  )}
                />
              )}
              {tab.value === 'listings' && (
                <Label
                  label={formatTotalTabItems(listingsCount || 0)}
                  className={cn(
                    'xs:text-sm sm:text-md xs:min-w-[16px] xs:h-[16px] h-[14px] min-w-[14px] px-0.5! text-xs sm:h-[18px] sm:min-w-[18px]',
                    selectedTab.value === tab.value ? 'bg-primary' : 'bg-neutral'
                  )}
                />
              )}
              {tab.value === 'categories' && (
                <Label
                  label={categories?.length || 0}
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
      <div className='hidden items-center gap-2 md:flex'>
        {selectedTab.value !== 'categories' && selectedTab.value !== 'holders' && <DownloadButton />}
        {selectedTab.value !== 'categories' && selectedTab.value !== 'holders' && <ViewSelector />}
      </div>
    </div>
  )
}

export default CategoriesPageTabSwitcher
