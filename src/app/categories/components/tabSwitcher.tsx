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
import MobileTabDropdown from '@/components/ui/mobileTabDropdown'
import { useCategories } from '@/components/filters/hooks/useCategories'
import { setBulkSelectIsSelecting } from '@/state/reducers/modals/bulkSelectModal'

const CategoriesPageTabSwitcher = () => {
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
  const disableFilterButton = selectedTab.value === 'holders'

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
  const renderTabLabel = (tab: CategoriesPageTabType, isActive: boolean) => (
    <>
      <p className='text-lg text-nowrap @[40rem]/app:text-xl'>{tab.label}</p>
      {tab.value === 'holders' && (
        <Label
          label={localizeNumber(holdersCount || 0)}
          className={cn(
            '@[40rem]/app:text-md h-[14px] min-w-[14px] px-0.5! text-xs @[26.25rem]/app:h-[16px] @[26.25rem]/app:min-w-[16px] @[26.25rem]/app:text-sm @[40rem]/app:h-[18px] @[40rem]/app:min-w-[18px]',
            isActive ? 'bg-primary' : 'bg-neutral'
          )}
        />
      )}
      {tab.value === 'listings' && (
        <Label
          label={formatTotalTabItems(listingsCount || 0)}
          className={cn(
            '@[40rem]/app:text-md h-[14px] min-w-[14px] px-0.5! text-xs @[26.25rem]/app:h-[16px] @[26.25rem]/app:min-w-[16px] @[26.25rem]/app:text-sm @[40rem]/app:h-[18px] @[40rem]/app:min-w-[18px]',
            isActive ? 'bg-primary' : 'bg-neutral'
          )}
        />
      )}
      {tab.value === 'categories' && (
        <Label
          label={categories?.length || 0}
          className={cn(
            '@[40rem]/app:text-md h-[14px] min-w-[14px] px-0.5! text-xs @[26.25rem]/app:h-[16px] @[26.25rem]/app:min-w-[16px] @[26.25rem]/app:text-sm @[40rem]/app:h-[18px] @[40rem]/app:min-w-[18px]',
            isActive ? 'bg-primary' : 'bg-neutral'
          )}
        />
      )}
    </>
  )

  // During SSR and initial mount, render without active state
  if (!mounted) {
    return (
      <div
        className={cn(
          'bg-background pr-lg border-tertiary text-md sticky z-10 flex min-h-12 items-center gap-2 border-b-2 transition-[top] duration-300 @[26.25rem]/app:gap-4 @[26.25rem]/app:text-lg @[40rem]/app:pr-0 @[40rem]/app:text-xl @[48rem]/app:min-h-14 @[64rem]/app:gap-8',
          isNavbarVisible ? 'top-14 md:top-[70px]' : 'top-0'
        )}
      >
        <div className='flex w-full items-center justify-between gap-3 @[48rem]/app:w-auto @[48rem]/app:gap-4'>
          <div className='flex flex-1 items-center gap-3 @[48rem]/app:flex-none @[48rem]/app:gap-4'>
            <button
              type='button'
              aria-label='Toggle filters'
              aria-disabled={disableFilterButton}
              disabled={disableFilterButton}
              className={cn(
                'border-tertiary bg-background hover:bg-secondary sticky left-0 z-10 flex h-12 min-h-12 w-12 min-w-12 cursor-pointer items-center justify-center border-r-2 transition-all @[48rem]/app:h-14 @[48rem]/app:min-h-14 @[48rem]/app:w-10 @[48rem]/app:min-w-14',
                disableFilterButton && 'pointer-events-none cursor-not-allowed'
              )}
              onClick={() => dispatch(actions.setFiltersOpen(!selectors.filters.open))}
            >
              <Image
                src={FilterIcon}
                alt='Filter'
                width={20}
                height={20}
                className={!disableFilterButton ? 'opacity-40' : 'opacity-10'}
              />
            </button>
            <div className='flex-1 @[48rem]/app:hidden'>
              <MobileTabDropdown
                options={CATEGORIES_PAGE_TABS.map((tab) => ({
                  value: tab.value,
                  label: renderTabLabel(tab, selectedTab.value === tab.value),
                  onClick: () => setCategoriesPageTab(tab),
                }))}
                value={selectedTab.value}
              />
            </div>
            <div ref={containerRef} className='relative hidden h-10 min-w-max gap-4 pr-4 @[48rem]/app:flex'>
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
                      'py-md flex w-fit shrink-0 cursor-pointer flex-row items-center justify-center gap-1 text-lg @[40rem]/app:text-xl',
                      selectedTab.value === tab.value
                        ? 'text-primary font-bold opacity-100'
                        : 'font-medium opacity-50 transition-colors hover:opacity-80'
                    )}
                  >
                    {renderTabLabel(tab, selectedTab.value === tab.value)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className='flex items-center gap-2 @[48rem]/app:hidden'>
            {selectedTab.value !== 'holders' && <ViewSelector />}
          </div>
        </div>
        <div className='hidden items-center @[48rem]/app:flex'>
          {selectedTab.value !== 'categories' && selectedTab.value !== 'holders' && (
            <DownloadButton inAnyCategory={true} />
          )}
          {selectedTab.value !== 'holders' && <ViewSelector />}
        </div>
      </div>
    )
  }

  // After mount, render with proper active state
  return (
    <div
      className={cn(
        'bg-background border-tertiary text-md pr-lg @[48rem]/app:touch-scroll-x sticky z-10 flex min-h-12 max-w-full items-center justify-between gap-2 border-b-2 transition-[top] duration-300 @[26.25rem]/app:gap-4 @[26.25rem]/app:text-lg @[40rem]/app:pr-0 @[40rem]/app:text-xl @[48rem]/app:min-h-14 @[48rem]/app:scrollbar-none @[48rem]/app:overflow-x-auto @[64rem]/app:gap-8',
        isNavbarVisible ? 'top-14 md:top-[72px]' : 'top-0'
      )}
    >
      <div className='flex w-full items-center justify-between gap-3 @[48rem]/app:w-auto @[48rem]/app:gap-4'>
        <div className='flex flex-1 items-center gap-3 @[48rem]/app:flex-none @[48rem]/app:gap-4'>
          <button
            type='button'
            aria-label='Toggle filters'
            aria-disabled={disableFilterButton}
            disabled={disableFilterButton}
            className={cn(
              'border-tertiary bg-background hover:bg-secondary sticky left-0 z-10 flex h-12 min-h-12 w-12 min-w-12 cursor-pointer items-center justify-center border-r-2 transition-all @[48rem]/app:h-14 @[48rem]/app:min-h-14 @[48rem]/app:w-10 @[48rem]/app:min-w-14',
              disableFilterButton && 'pointer-events-none cursor-not-allowed'
            )}
            onClick={() => dispatch(actions.setFiltersOpen(!selectors.filters.open))}
          >
            <Image
              src={FilterIcon}
              alt='Filter'
              width={20}
              height={20}
              className={!disableFilterButton ? 'opacity-40' : 'opacity-10'}
            />
          </button>

          <div className='flex-1 @[48rem]/app:hidden'>
            <MobileTabDropdown
              options={CATEGORIES_PAGE_TABS.map((tab) => ({
                value: tab.value,
                label: renderTabLabel(tab, selectedTab.value === tab.value),
                onClick: () => setCategoriesPageTab(tab),
              }))}
              value={selectedTab.value}
            />
          </div>

          <div
            ref={containerRef}
            className='relative hidden h-10 min-w-max gap-4 pr-4 @[48rem]/app:flex @[64rem]/app:w-full'
          >
            <div
              className='bg-primary absolute bottom-1.5 h-0.5 rounded-full transition-all duration-300 ease-out'
              style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
            />
            {CATEGORIES_PAGE_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setCategoriesPageTab(tab)}
                className={cn(
                  'py-md flex w-fit shrink-0 cursor-pointer flex-row items-center justify-center gap-1 text-lg',
                  selectedTab.value === tab.value
                    ? 'text-primary font-bold opacity-100'
                    : 'font-medium opacity-50 transition-colors hover:opacity-80'
                )}
              >
                {renderTabLabel(tab, selectedTab.value === tab.value)}
              </button>
            ))}
          </div>
        </div>

        <div className='flex items-center gap-2 @[48rem]/app:hidden'>
          {selectedTab.value !== 'holders' && <ViewSelector />}
        </div>
      </div>

      <div className='hidden items-center @[48rem]/app:flex'>
        {selectedTab.value !== 'categories' && selectedTab.value !== 'holders' && (
          <DownloadButton inAnyCategory={true} />
        )}
        {selectedTab.value !== 'holders' && <ViewSelector />}
      </div>
    </div>
  )
}

export default CategoriesPageTabSwitcher
