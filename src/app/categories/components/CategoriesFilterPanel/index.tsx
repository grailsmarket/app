'use client'

import Image from 'next/image'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import {
  selectCategoriesPageFilters,
  clearCategoriesPageFilters,
  setCategoriesPageSearch,
} from '@/state/reducers/filters/categoriesPageFilters'
import { Cross, useIsClient } from 'ethereum-identity-kit'
import { cn } from '@/utils/tailwind'
import FilterIcon from 'public/icons/filter.svg'
import { useNavbar } from '@/context/navbar'
import CategoryTypeFilter from '../CategoryTypeFilter'
import { selectFilterPanel, setFilterPanelOpen } from '@/state/reducers/filterPanel'
import SecondaryButton from '@/components/ui/buttons/secondary'
import CategoriesSortDropdown from '../CategoriesSortDropdown'
import MagnifyingGlass from 'public/icons/search.svg'
import CloseIcon from 'public/icons/cross.svg'
import ViewSelector from '@/components/domains/viewSelector'
import { useResponsiveSize } from '@/hooks/useResponsiveSize'

const CategoriesFilterPanel: React.FC = () => {
  const isClient = useIsClient()
  const { width: responsiveWidth } = useResponsiveSize()
  const dispatch = useAppDispatch()
  const filters = useAppSelector(selectCategoriesPageFilters)
  const filterPanel = useAppSelector(selectFilterPanel)
  const filtersOpen = filterPanel.open
  const isFiltersClear = filters.type === null
  const { isNavbarVisible } = useNavbar()

  if (!isClient || !responsiveWidth) return null

  const isMobile = responsiveWidth < 1024
  const isOpen = filtersOpen

  const handleClose = () => {
    dispatch(setFilterPanelOpen(false))
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setCategoriesPageSearch(e.target.value))
  }

  const handleClearFilters = () => {
    dispatch(clearCategoriesPageFilters())
  }

  // Check if any filters are active
  const hasActiveFilters = filters.type !== null

  return (
    <div
      className={cn(
        'bg-background border-tertiary z-30 flex flex-col overflow-hidden overscroll-contain transition-all duration-300',
        // Mobile styles
        isMobile &&
          'fixed left-0 w-[calc(100%-var(--chat-sidebar-width,0))] shadow-md @[48rem]/app:max-w-[292px] @[48rem]/app:min-w-[292px]',
        isMobile && (isNavbarVisible ? 'top-[56px] h-[calc(100dvh-56px)]' : 'top-0 left-0 h-dvh'),
        isMobile && 'md:top-[70px] md:h-[calc(100dvh-70px)]',
        isMobile && (isOpen ? 'translate-x-0' : 'translate-x-[-110%]'),
        // Desktop styles
        !isMobile && 'sticky',
        !isMobile && (isNavbarVisible ? 'top-[130px] h-[calc(100dvh-130px)]' : 'top-[58px] h-[calc(100dvh-58px)]'),
        !isMobile && (isOpen ? 'w-[292px] min-w-[292px]' : 'w-0 min-w-0'),
        isOpen ? '@[48rem]/app:border-r-2' : 'w-0'
      )}
    >
      <div
        className={cn(
          'left-0 z-40 flex flex-col gap-y-px transition-[width] duration-300 @[64rem]/app:relative @[64rem]/app:duration-100',
          isOpen ? 'w-full overflow-x-hidden @[64rem]/app:w-[292px]' : 'w-0 @[64rem]/app:z-0 @[64rem]/app:w-[56px]'
        )}
      >
        {/* Header */}
        <div className='pt-md relative flex items-center justify-between'>
          <div className='px-md @[40rem]/app:px-lg py-md flex w-full min-w-full justify-between @[64rem]/app:min-w-[292px]'>
            <button
              onClick={handleClose}
              className='border-foreground flex h-9 w-9 cursor-pointer items-center justify-center rounded-sm border opacity-30 transition-opacity hover:opacity-80 @max-[64rem]/app:flex @[48rem]/app:h-10 @[48rem]/app:w-10 @[64rem]/app:hidden'
            >
              <Image src={CloseIcon} alt='Close' width={16} height={16} />
            </button>
            <div className='flex max-w-full items-center gap-1.5 text-sm leading-6 font-bold'>
              <Image src={FilterIcon} alt='filter icon' height={16} width={16} />
              <p className='text-light-800 text-xl leading-6 font-bold'>Filters</p>
            </div>
            <div className='flex items-center gap-2'>
              <SecondaryButton onClick={handleClearFilters} disabled={isFiltersClear}>
                Clear
              </SecondaryButton>
              <span className='flex items-center gap-2 @[48rem]/app:hidden'>
                <ViewSelector />
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className='flex-1 overflow-x-hidden overflow-y-auto'>
        <div className='px-md @[40rem]/app:px-lg py-md flex w-full flex-col gap-2'>
          <div className='group border-tertiary flex h-9 w-full items-center justify-between gap-1.5 rounded-sm border-2 bg-transparent px-3 transition-all outline-none focus-within:border-white/80! hover:border-white/50 @[40rem]/app:h-10'>
            <input
              type='text'
              placeholder='Search categories'
              value={filters.search || ''}
              onChange={handleSearchChange}
              className='w-full bg-transparent text-lg outline-none'
            />
            {filters.search.length > 0 ? (
              <Cross
                onClick={() => {
                  dispatch(setCategoriesPageSearch(''))
                }}
                className='h-4 w-4 cursor-pointer p-0.5 opacity-100 transition-opacity hover:opacity-70'
              />
            ) : (
              <Image
                src={MagnifyingGlass}
                alt='Search'
                width={16}
                height={16}
                className='opacity-40 transition-opacity group-focus-within:opacity-100! group-hover:opacity-70'
              />
            )}
          </div>
          <CategoriesSortDropdown />
        </div>
        <div className='w-full'>
          <CategoryTypeFilter />
        </div>
      </div>

      {hasActiveFilters && (
        <div className='border-tertiary flex w-[292px] justify-end border-t-2 p-4'>
          <SecondaryButton onClick={handleClearFilters}>Clear all filters</SecondaryButton>
        </div>
      )}
    </div>
  )
}

export default CategoriesFilterPanel
