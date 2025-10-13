import { PersistGate } from 'redux-persist/integration/react'
import { useFilterButtons } from '../../hooks/useFilterButtons'
import { persistor } from '@/state'
import TypeFilter from '../TypeFilter'
import StatusFilter from '../StatusFilter'
import LengthFilter from '../LengthFilter'
import CategoryFilter from '../CategoryFilter'
import PriceRangeFilter from '../PriceRangeFilter'
import CategoryFilterTab from '../CategoryFilterTab'
import {
  MARKETPLACE_CATEGORIES,
} from '@/constants/filters/marketplaceFilters'
import { MarketplaceCategoryType } from '@/state/reducers/filters/marketplaceFilters'

interface FiltersProps {
  isPanelCategories: boolean
  setPanelCategories: () => void
}

const Filters: React.FC<FiltersProps> = ({
  isPanelCategories,
  setPanelCategories,
}) => {
  const { isFiltersClear, clearFilters } = useFilterButtons()

  return (
    <div className='w-full h-full flex flex-col items-center justify-between'>
      <div className='flex h-full w-full overflow-x-hidden lg:flex-1'>
        <div
          className={`hide-scrollbar flex min-w-full flex-col gap-y-px overflow-y-scroll transition-transform lg:min-w-[280px] lg:flex-1 ${isPanelCategories && '-translate-x-[100%] lg:-translate-x-[280px]'
            }`}
        >
          <StatusFilter />
          <TypeFilter />
          <CategoryFilterTab setPanelCategories={setPanelCategories} />
          <LengthFilter />
          <PriceRangeFilter />
          <div className="flex-1" />
        </div>
        <div
          className={`hide-scrollbar flex min-w-full flex-1 flex-col gap-y-px overflow-y-scroll transition-transform lg:min-w-[282px] ${isPanelCategories && '-translate-x-[100%] lg:-translate-x-[280px]'
            }`}
        >
          {MARKETPLACE_CATEGORIES.map((category, index) => (
            <CategoryFilter key={index} category={category as MarketplaceCategoryType} />
          ))}
          <div className="flex-1" />
        </div>
      </div>

      {/* Bottom div */}
      <div className="flex justify-end gap-x-2 rounded-none bg-dark-800 px-4 py-[15px] pb-[70px] lg:rounded-bl-xl lg:pb-[15px]">
        <PersistGate persistor={persistor}>
          <button disabled={isFiltersClear} onClick={clearFilters} className='bg-tertiary p-md rounded-sm text-lg font-bold cursor-pointer hover:opacity-60 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 transition-all'>
            Clear Filters
          </button>
        </PersistGate>
      </div>
    </div>
  )
}

export default Filters
