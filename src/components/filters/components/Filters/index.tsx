import TypeFilter from '../TypeFilter'
import StatusFilter from '../StatusFilter'
import LengthFilter from '../LengthFilter'
import CategoryFilter from '../CategoryFilter'
import PriceRangeFilter from '../PriceRangeFilter'
import CategoryFilterTab from '../CategoryFilterTab'
import { MARKETPLACE_CATEGORIES } from '@/constants/filters/marketplaceFilters'
import { MarketplaceCategoryType } from '@/state/reducers/filters/marketplaceFilters'

interface FiltersProps {
  isPanelCategories: boolean
  setPanelCategories: () => void
}

const Filters: React.FC<FiltersProps> = ({ isPanelCategories, setPanelCategories }) => {
  return (
    <div className='flex h-full w-full overflow-x-hidden'>
      <div
        className={`hide-scrollbar flex min-w-full flex-col gap-y-px overflow-y-scroll transition-transform lg:min-w-[280px] lg:flex-1 ${isPanelCategories && '-translate-x-[100%] lg:-translate-x-[280px]'
          }`}
      >
        <StatusFilter />
        <TypeFilter />
        <CategoryFilterTab setPanelCategories={setPanelCategories} />
        <LengthFilter />
        <PriceRangeFilter />
        <div className='flex-1' />
      </div>
      <div
        className={`hide-scrollbar flex min-w-full flex-1 flex-col gap-y-px overflow-y-scroll transition-transform lg:min-w-[282px] ${isPanelCategories && '-translate-x-[100%] lg:-translate-x-[280px]'
          }`}
      >
        {MARKETPLACE_CATEGORIES.map((category, index) => (
          <CategoryFilter key={index} category={category as MarketplaceCategoryType} />
        ))}
        <div className='flex-1' />
      </div>
    </div>
  )
}

export default Filters
