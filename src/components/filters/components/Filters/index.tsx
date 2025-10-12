import { PersistGate } from 'redux-persist/integration/react'

import { useFilterButtons } from '../../hooks/useFilterButtons'

import { persistor } from '@/app/state'

import Button from '@/app/ui/Button'
import TypeFilter from '../TypeFilter'
import StatusFilter from '../StatusFilter'
import LengthFilter from '../LengthFilter'
import CategoryFilter from '../CategoryFilter'
import PriceRangeFilter from '../PriceRangeFilter'
import CategoryFilterTab from '../CategoryFilterTab'

import {
  ExclusiveStatusFilterType,
  QUICK_FILTER_CATEGORIES as MARKETPLACE_CATEGORIES,
} from '@/app/constants/filters/marketplaceFilters'

interface FiltersProps {
  isPanelCategories: boolean
  setPanelCategories: () => void
  exclusiveStatusFilter?: ExclusiveStatusFilterType
}

const Filters: React.FC<FiltersProps> = ({
  isPanelCategories,
  setPanelCategories,
  exclusiveStatusFilter,
}) => {
  const { isFiltersClear, clearFilters } = useFilterButtons()

  return (
    <>
      <div className={`flex h-full w-full overflow-x-hidden lg:flex-1`}>
        <div
          className={`hide-scrollbar flex min-w-full flex-col gap-y-px overflow-y-scroll transition-transform lg:min-w-[280px] lg:flex-1 ${
            isPanelCategories && '-translate-x-[100%] lg:-translate-x-[280px]'
          }`}
        >
          <StatusFilter exclusiveStatusFilter={exclusiveStatusFilter} />
          <TypeFilter />
          <CategoryFilterTab setPanelCategories={setPanelCategories} />
          <LengthFilter />
          <PriceRangeFilter />
          <div className="flex-1 bg-dark-700" />
        </div>
        <div
          className={`hide-scrollbar flex min-w-full flex-1 flex-col gap-y-px overflow-y-scroll transition-transform lg:min-w-[282px] ${
            isPanelCategories && '-translate-x-[100%] lg:-translate-x-[280px]'
          }`}
        >
          {MARKETPLACE_CATEGORIES.map((category, index) => (
            <CategoryFilter key={index} category={category} />
          ))}
          <div className="flex-1 bg-dark-700" />
        </div>
      </div>

      {/* Bottom div */}
      <div className="flex justify-end gap-x-2 rounded-none bg-dark-800 px-4 py-[15px] pb-[70px] lg:rounded-bl-xl lg:pb-[15px]">
        <PersistGate persistor={persistor}>
          <Button disabled={isFiltersClear} onClick={clearFilters}>
            Clear Filters
          </Button>
        </PersistGate>
      </div>
    </>
  )
}

export default Filters
