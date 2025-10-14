'use client'

import Image from 'next/image'
import { usePanels } from './hooks/usePanels'
import Filters from './components/Filters'
import backArrow from 'public/icons/arrow-back.svg'
import FilterIcon from 'public/icons/filter.svg'
import { selectMarketplaceFilters, setMarketplaceFiltersOpen } from '@/state/reducers/filters/marketplaceFilters'
import { useOutsideClick, useWindowSize } from 'ethereum-identity-kit'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { cn } from '@/utils/tailwind'
import { RefObject } from 'react'
import CloseIcon from 'public/icons/cross.svg'


const FilterPanel: React.FC = () => {
  const { width: windowWidth } = useWindowSize()
  const { isPanelCategories, setPanelCategories, setPanelAll } = usePanels()

  const dispatch = useAppDispatch()
  const { open: filtersOpen } = useAppSelector(selectMarketplaceFilters)
  const isExpandable = windowWidth && windowWidth < 1024
  const isOpen = isExpandable ? filtersOpen : true

  const outsideClickRef = useOutsideClick(() => {
    dispatch(setMarketplaceFiltersOpen(false))
  })

  return (
    <div ref={outsideClickRef as RefObject<HTMLDivElement>} className={cn('transition-transform duration-300 absolute z-20 left-0 top-0 bg-background -translate-x-full lg:relative h-[90vh] shadow-md lg:shadow-none lg:h-full w-full sm:w-72 overflow-y-auto', isOpen ? 'translate-x-0' : '-translate-x-full')}>
      <div
        className={cn(
          'left-0 z-40 flex flex-col gap-y-px transition-[width] duration-300 lg:relative lg:duration-100',
          isOpen ? 'w-full overflow-x-hidden lg:w-[282px]' : 'w-0 lg:z-0 lg:w-[56px]'
        )}
      >
        {/* Top div */}
        <div className='relative flex items-center justify-between p-4 pr-0 lg:pr-4'>
          <div
            className={`flex w-full min-w-full justify-between transition-transform pr-lg lg:min-w-[300px] ${isPanelCategories && '-translate-x-[100%] lg:-translate-x-[300px]'
              }`}
          >
            <div className='flex max-w-full items-center gap-1.5 text-sm leading-6 font-bold'>
              <Image src={FilterIcon} alt='back arrow' height={14} width={14} />
              <p className='text-light-800 text-lg leading-6 font-bold'>Filters</p>
            </div>
            <button onClick={() => dispatch(setMarketplaceFiltersOpen(false))} className='hover:opacity-80 cursor-pointer transition-opacity'><Image src={CloseIcon} alt='Close' width={16} height={16} /></button>
          </div>
          <div
            className={cn(
              'flex min-w-full transition-transform lg:min-w-[300px]',
              isPanelCategories && '-translate-x-[100%] lg:-translate-x-[300px]'
            )}
          >
            <button onClick={setPanelAll} className='flex cursor-pointer items-center gap-1'>
              <Image src={backArrow} alt='back arrow' height={13} width={13} className='mr-[9px] rotate-180' />
              <p className='text-light-800 h-[22px] text-lg leading-6 font-bold'>Categories</p>
            </button>
          </div>
        </div>
      </div>

      {/* Middle div */}
      {isOpen && <Filters isPanelCategories={isPanelCategories} setPanelCategories={setPanelCategories} />}
    </div>
  )
}

export default FilterPanel
