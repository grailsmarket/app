import Image from 'next/image'
import { PersistGate } from 'redux-persist/integration/react'

import { useFilterOpen } from '../../hooks/useFilterOpen'
import { useCategoryFilter } from './hooks/useCategoryFilter'
import { persistor } from '@/state'
import FilterSelector from '../FilterSelector'
import { MarketplaceCategoryType } from '@/state/reducers/filters/marketplaceFilters'

import arrowDown from 'public/icons/arrow-down.svg'

interface CategoryFilterProps {
  category: MarketplaceCategoryType
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ category }) => {
  const { open, toggleOpen } = useFilterOpen()
  const {
    subcategoryFilterHeight,
    isCategoryActive,
    toggleCategory,
  } = useCategoryFilter(category)

  return (
    <PersistGate persistor={persistor}>
      <div className="w-full p-4">
        <div
          className={`overflow-y-hidden transition-all`}
          style={{
            height: open ? subcategoryFilterHeight : '18px',
          }}
        >
          <div
            className="flex cursor-pointer items-center justify-between"
            onClick={toggleOpen}
          >
            <div className="flex items-center gap-x-2">
              <FilterSelector
                onClick={toggleCategory}
                isActive={isCategoryActive}
              />
              <p className="text-xs font-medium leading-[18px] text-light-100">
                {category}
              </p>
            </div>
            <div className="flex items-center gap-x-4">
              <p className="text-[10px] text-light-200 opacity-30">0</p>
              <Image
                src={arrowDown}
                alt="chevron up"
                className={`transition-all ${open ? 'rotate-180' : 'rotate-0'}`}
              />
            </div>
          </div>
          <div className="mb-4 mt-4 h-px w-full bg-dark-500" />


        </div>
      </div>
    </PersistGate>
  )
}

export default CategoryFilter
