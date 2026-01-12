'use client'

import Image from 'next/image'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { selectCategoriesPageFilters, clearCategoriesPageFilters } from '@/state/reducers/filters/categoriesPageFilters'
import { useIsClient, useWindowSize } from 'ethereum-identity-kit'
import { cn } from '@/utils/tailwind'
import FilterIcon from 'public/icons/filter.svg'
import CloseIcon from 'public/icons/cross.svg'
import { useNavbar } from '@/context/navbar'
import CategoryTypeFilter from '../CategoryTypeFilter'
import { selectFilterPanel, setFilterPanelOpen } from '@/state/reducers/filterPanel'
import SecondaryButton from '@/components/ui/buttons/secondary'

const CategoriesFilterPanel: React.FC = () => {
  const isClient = useIsClient()
  const { width: windowWidth } = useWindowSize()
  const dispatch = useAppDispatch()
  const filters = useAppSelector(selectCategoriesPageFilters)
  const filterPanel = useAppSelector(selectFilterPanel)
  const filtersOpen = filterPanel.open
  const isFiltersClear = filters.type === null
  const { isNavbarVisible } = useNavbar()

  if (!isClient || !windowWidth) return null

  const isMobile = windowWidth < 1024
  const isOpen = filtersOpen

  const handleClose = () => {
    dispatch(setFilterPanelOpen(false))
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
        isMobile && 'fixed left-0 w-full shadow-md md:max-w-[292px] md:min-w-[292px]',
        isMobile && (isNavbarVisible ? 'top-14 h-[calc(100dvh-56px)]' : 'top-0 left-0 h-[100dvh] w-full'),
        isMobile && 'md:top-[70px] md:h-[calc(100dvh-70px)]',
        isMobile && (isOpen ? 'translate-x-0' : '-translate-x-[110%]'),
        // Desktop styles
        !isMobile && 'sticky',
        !isMobile && (isNavbarVisible ? 'top-[70px] h-[calc(100dvh-70px)]' : 'top-14 h-[calc(100dvh-56px)]'),
        !isMobile && (isOpen ? 'w-[292px] min-w-[292px]' : 'w-0 min-w-0'),
        isOpen ? 'md:border-r-2' : 'w-0'
      )}
    >
      <div
        className={cn(
          'left-0 z-40 flex flex-col gap-y-px transition-[width] duration-300 lg:relative lg:duration-100',
          isOpen ? 'w-full overflow-x-hidden lg:w-[292px]' : 'w-0 lg:z-0 lg:w-[56px]'
        )}
      >
        {/* Header */}
        <div className='pt-md relative flex items-center justify-between'>
          <div className='px-lg py-md flex w-full min-w-full justify-between lg:min-w-[292px]'>
            <button
              onClick={handleClose}
              className='border-foreground flex h-9 w-9 cursor-pointer items-center justify-center rounded-sm border opacity-30 transition-opacity hover:opacity-80 md:h-10 md:w-10'
            >
              <Image src={CloseIcon} alt='Close' width={16} height={16} />
            </button>
            <div className='flex max-w-full items-center gap-1.5 text-sm leading-6 font-bold'>
              <Image src={FilterIcon} alt='filter icon' height={16} width={16} />
              <p className='text-light-800 text-xl leading-6 font-bold'>Filters</p>
            </div>
            <SecondaryButton onClick={handleClearFilters} disabled={isFiltersClear}>
              Clear
            </SecondaryButton>
          </div>
        </div>
      </div>

      <div className='flex-1 overflow-x-hidden overflow-y-auto'>
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
