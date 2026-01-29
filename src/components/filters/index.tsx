'use client'

import Image from 'next/image'
import { usePanels } from './hooks/usePanels'
import Filters from './components/Filters'
import backArrow from 'public/icons/arrow-back.svg'
import FilterIcon from 'public/icons/filter.svg'
import { useIsClient, useWindowSize } from 'ethereum-identity-kit'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { cn } from '@/utils/tailwind'
import CloseIcon from 'public/icons/cross.svg'
import { useFilterContext } from '@/context/filters'
import ActivityTypeFilter from './ActivityFilter/TypeFilter'
import { useEffect, useRef } from 'react'
import { selectMarketplace } from '@/state/reducers/marketplace/marketplace'
import { useNavbar } from '@/context/navbar'
import SecondaryButton from '../ui/buttons/secondary'
import ViewSelector from '../domains/viewSelector'
import DownloadButton from '../ui/downloadButton'

const FilterPanel: React.FC = () => {
  const filterRef = useRef<HTMLDivElement>(null)
  const isClient = useIsClient()
  const { width: windowWidth } = useWindowSize()
  const { isPanelCategories, setPanelCategories, setPanelAll } = usePanels()

  useEffect(() => {
    if (filterRef.current) {
      filterRef.current.scrollTo({ top: 0, behavior: 'instant' })
    }
  }, [isPanelCategories])

  const dispatch = useAppDispatch()
  // const { search } = useAppSelector(selectMarketplaceFilters)
  const { selectors, actions, isFiltersClear } = useFilterRouter()
  const { profileTab, filterType, categoryTab } = useFilterContext()
  const { selectedTab: marketplaceTab } = useAppSelector(selectMarketplace)
  const filtersOpen = selectors.filters.open
  const { isNavbarVisible } = useNavbar()

  // const outsideClickRef = useOutsideClick(() => {
  //   dispatch(actions.setFiltersOpen(false))
  // })

  if (!isClient || !windowWidth) return null

  const isMobile = windowWidth < 1024
  const isOpen = filtersOpen
  // const isBulkSearch = search.replaceAll(' ', ',').split(',').length > 1
  // const isDisabled = filterType === 'marketplace' && isBulkSearch
  const isActivityFilter =
    (filterType === 'profile' && profileTab?.value === 'activity') ||
    (filterType === 'marketplace' && marketplaceTab?.value === 'activity') ||
    (filterType === 'category' && categoryTab?.value === 'activity')

  // On mobile: slide in/out overlay
  // On desktop: collapse/expand sidebar with width transition
  return (
    <div
      ref={filterRef}
      className={cn(
        'bg-background border-tertiary z-30 flex flex-col overflow-hidden overscroll-contain transition-all duration-300',
        // Mobile styles
        isMobile && 'fixed left-0 w-full shadow-md md:max-w-[292px] md:min-w-[292px]',
        isMobile && (isNavbarVisible ? 'top-14 h-[calc(100dvh-56px)]' : 'top-0 left-0 h-[100dvh] w-full'),
        isMobile && 'md:top-[70px] md:h-[calc(100dvh-70px)]',
        isMobile && (isOpen ? 'translate-x-0' : '-translate-x-[110%]'),
        // Desktop styles
        !isMobile && 'sticky',
        !isMobile && (isNavbarVisible ? 'top-[128px] h-[calc(100dvh-128px)]' : 'top-14 h-[calc(100dvh-56px)]'),
        !isMobile && (isOpen ? 'w-[292px] min-w-[292px]' : 'w-0 min-w-0'),
        // isDisabled && 'pointer-events-none cursor-not-allowed opacity-50',
        isOpen ? 'md:border-r-2' : 'w-0'
      )}
    >
      <div
        className={cn(
          'left-0 z-40 flex flex-col gap-y-px transition-[width] duration-300 lg:relative lg:duration-100',
          isOpen ? 'w-full overflow-x-hidden lg:w-[292px]' : 'w-0 lg:z-0 lg:w-[56px]'
        )}
      >
        {/* Top div */}
        <div className='pt-md relative flex items-center justify-between'>
          <div
            className={cn(
              'px-lg py-md flex w-full min-w-full justify-between transition-transform lg:min-w-[292px]',
              isPanelCategories && '-translate-x-[100%] lg:-translate-x-[292px]'
            )}
          >
            <div className='flex items-center gap-2'>
              <button
                onClick={() => {
                  dispatch(actions.setFiltersOpen(false))
                }}
                className='border-foreground flex h-9 w-9 cursor-pointer items-center justify-center rounded-sm border opacity-30 transition-opacity hover:opacity-80 md:h-10 md:w-10 lg:hidden'
              >
                <Image src={CloseIcon} alt='Close' width={16} height={16} />
              </button>
              <div className='flex max-w-full items-center gap-1.5 pl-0.5 text-sm font-bold'>
                <Image src={FilterIcon} alt='filter icon' height={16} width={16} />
                <p className='text-light-800 text-xl leading-6 font-bold'>Filters</p>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <SecondaryButton
                onClick={() => {
                  dispatch(actions.clearFilters())
                }}
                disabled={isFiltersClear}
              >
                Clear
              </SecondaryButton>
              <span className='md:hidden'>
                <ViewSelector />
                <DownloadButton />
              </span>
            </div>
          </div>
          <button
            onClick={setPanelAll}
            className={cn(
              'p-lg hover:bg-secondary flex min-w-full cursor-pointer items-center gap-2 rounded-sm transition-transform sm:min-w-[284px] lg:min-w-[284px]',
              isPanelCategories && '-translate-x-[100%] lg:-translate-x-[289px]'
            )}
          >
            <Image src={backArrow} alt='back arrow' height={12} width={12} className='rotate-180' />
            <p className='text-lg leading-6 font-bold'>Categories</p>
          </button>
        </div>
      </div>

      {/* Middle div */}
      {isActivityFilter ? (
        <ActivityTypeFilter />
      ) : (
        <Filters isPanelCategories={isPanelCategories} setPanelCategories={setPanelCategories} />
      )}
    </div>
  )
}

export default FilterPanel
