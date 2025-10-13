'use client'

import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { usePanels } from './hooks/usePanels'
import Filters from './components/Filters'
import backArrow from 'public/icons/arrow-back.svg'
import FilterIcon from 'public/icons/filter.svg'
import { selectMarketplaceFilters } from '@/state/reducers/filters/marketplaceFilters'
import { useWindowSize } from 'ethereum-identity-kit'
import { useAppSelector } from '@/state/hooks'
import { cn } from '@/utils/tailwind'

interface FilterPanelProps {
  mobileButtonOffset?: string
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  mobileButtonOffset,
}) => {
  const { width: windowWidth } = useWindowSize()
  const { isPanelCategories, setPanelCategories, setPanelAll } = usePanels()
  const pathname = usePathname()

  const { open: filtersOpen } = useAppSelector(selectMarketplaceFilters)
  const isExpandable = windowWidth && windowWidth < 768
  const isOpen = isExpandable ? filtersOpen : true

  return (
    <div className='relative w-72 h-full overflow-y-auto'>
      <div
        className={cn('absolute left-0 z-30 pl-4 pt-[7px] lg:hidden', mobileButtonOffset || 'top-[122px]')}
      >
        <div className="rounded-sm bg-dark-400 p-[9px]">
          <Image
            src={FilterIcon}
            alt="Filters"
            width={20}
            height={20}
            className="h-5 w-5 cursor-pointer"
          />
          <p className="text-lg font-bold leading-6 text-light-800">Filters</p>
        </div>
      </div>
      <div
        className={cn('fixed left-0 z-40 flex lg:relative flex-col gap-y-px bg-dark-900 transition-[width] duration-[0.4s] lg:duration-100',
          pathname.includes('/portfolio')
            ? 'h-[calc(100vh-3rem)] lg:h-full'
            : 'h-[calc(100vh-3.5rem)] lg:h-full',
          isOpen
            ? 'w-full overflow-x-hidden lg:w-[282px]'
            : 'w-0 lg:z-0 lg:w-[56px]'
        )}
      >
        {/* Top div */}
        <div
          className='relative flex items-center justify-between p-4 pr-0 lg:pr-4'
        >
          <div
            className={`flex w-full min-w-full justify-between transition-transform lg:min-w-[300px] ${isPanelCategories &&
              '-translate-x-[100%] lg:-translate-x-[300px] '
              }`}
          >
            <div className="flex max-w-full gap-1.5 items-center text-sm font-bold leading-6">
              <Image
                src={FilterIcon}
                alt="back arrow"
                height={14}
                width={14}
              />
              <p className="text-lg font-bold leading-6 text-light-800">Filters</p>
            </div>
          </div>
          <div
            className={cn('flex min-w-full transition-transform lg:min-w-[300px]', isPanelCategories &&
              '-translate-x-[100%] lg:-translate-x-[300px]'
            )}
          >
            <button onClick={setPanelAll} className="flex items-center gap-1 cursor-pointer">
              <Image
                src={backArrow}
                alt="back arrow"
                height={13}
                width={13}
                className="mr-[9px] rotate-180"
              />
              <p className="h-[22px] text-lg font-bold leading-6 text-light-800">
                Categories
              </p>
            </button>
          </div>
        </div>
      </div>

      {/* Middle div */}
      {isOpen && (
        <Filters
          isPanelCategories={isPanelCategories}
          setPanelCategories={setPanelCategories}
        />
      )}
    </div>
  )
}

export default FilterPanel
