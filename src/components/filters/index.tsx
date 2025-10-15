'use client'

import Image from 'next/image'
import { usePanels } from './hooks/usePanels'
import Filters from './components/Filters'
import backArrow from 'public/icons/arrow-back.svg'
import FilterIcon from 'public/icons/filter.svg'
import { useOutsideClick, useWindowSize } from 'ethereum-identity-kit'
import { useAppDispatch } from '@/state/hooks'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { cn } from '@/utils/tailwind'
import { RefObject } from 'react'
import CloseIcon from 'public/icons/cross.svg'

const FilterPanel: React.FC = () => {
  const { width: windowWidth } = useWindowSize()
  const { isPanelCategories, setPanelCategories, setPanelAll } = usePanels()

  const dispatch = useAppDispatch()
  const { selectors, actions } = useFilterRouter()

  const filtersOpen = selectors.filters.open

  const isExpandable = windowWidth && windowWidth < 1024
  const isOpen = isExpandable ? filtersOpen : true

  const outsideClickRef = useOutsideClick(() => {
    dispatch(actions.setFiltersOpen(false))
  })

  return (
    <div
      ref={outsideClickRef as RefObject<HTMLDivElement>}
      className={cn(
        'bg-background absolute top-0 left-0 z-20 h-[90vh] w-full overflow-y-auto shadow-md transition-transform duration-300 sm:w-72 lg:relative lg:h-[calc(100vh-146px)] lg:shadow-none',
        isOpen ? 'translate-x-0' : '-translate-x-[110%]'
      )}
    >
      <div
        className={cn(
          'left-0 z-40 flex flex-col gap-y-px transition-[width] duration-300 lg:relative lg:duration-100',
          isOpen ? 'w-full overflow-x-hidden lg:w-[282px]' : 'w-0 lg:z-0 lg:w-[56px]'
        )}
      >
        {/* Top div */}
        <div className='relative flex items-center justify-between'>
          <div
            className={cn(
              'pr-lg flex w-full min-w-full justify-between transition-transform lg:min-w-[300px]',
              isPanelCategories && '-translate-x-[100%] lg:-translate-x-[300px]'
            )}
          >
            <div className='p-lg flex max-w-full items-center gap-1.5 text-sm leading-6 font-bold'>
              <Image src={FilterIcon} alt='back arrow' height={14} width={14} />
              <p className='text-light-800 text-lg leading-6 font-bold'>Filters</p>
            </div>
            <button
              onClick={() => {
                dispatch(actions.setFiltersOpen(false))
              }}
              className='cursor-pointer transition-opacity hover:opacity-80 lg:hidden'
            >
              <Image src={CloseIcon} alt='Close' width={16} height={16} />
            </button>
          </div>
          <button
            onClick={setPanelAll}
            className={cn(
              'p-lg hover:bg-secondary flex min-w-full cursor-pointer items-center gap-2 rounded-sm transition-transform sm:min-w-[290px] lg:min-w-[282px]',
              isPanelCategories && '-translate-x-[100%] lg:-translate-x-[300px]'
            )}
          >
            <Image src={backArrow} alt='back arrow' height={12} width={12} className='rotate-180' />
            <p className='text-lg leading-6 font-bold'>Categories</p>
          </button>
        </div>
      </div>

      {/* Middle div */}
      {isOpen && <Filters isPanelCategories={isPanelCategories} setPanelCategories={setPanelCategories} />}
    </div>
  )
}

export default FilterPanel
