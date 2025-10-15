import TypeFilter from '../TypeFilter'
import StatusFilter from '../StatusFilter'
import LengthFilter from '../LengthFilter'
import CategoryFilter from '../CategoryFilter'
import PriceRangeFilter from '../PriceRangeFilter'
import CategoryFilterTab from '../CategoryFilterTab'
import { MARKETPLACE_CATEGORIES } from '@/constants/filters/marketplaceFilters'
import { MY_DOMAINS_CATEGORIES } from '@/constants/filters/portfolioFilters'
import { MarketplaceCategoryType } from '@/state/reducers/filters/marketplaceFilters'
import { useFilterContext } from '@/contexts/FilterContext'

interface FiltersProps {
  isPanelCategories: boolean
  setPanelCategories: () => void
}

const Filters: React.FC<FiltersProps> = ({ isPanelCategories, setPanelCategories }) => {
  const { filterType, portfolioTab } = useFilterContext()

  // Use appropriate categories based on filter context
  const categories = filterType === 'marketplace' ? MARKETPLACE_CATEGORIES : MY_DOMAINS_CATEGORIES
  const showCategoryTab = filterType === 'marketplace' || portfolioTab === 'domains' || portfolioTab === 'watchlist' // Only show category tab for marketplace and portfolio domains tab

  return (
    <div className='flex w-full overflow-x-hidden pb-10'>
      <div
        className={`hide-scrollbar flex min-w-full flex-col gap-y-2 overflow-y-scroll transition-transform lg:min-w-[280px] lg:flex-1 ${isPanelCategories && '-translate-x-[100%] lg:-translate-x-[280px]'
          }`}
      >
        <StatusFilter />
        <TypeFilter />
        <LengthFilter />
        <PriceRangeFilter />
        {showCategoryTab && <CategoryFilterTab setPanelCategories={setPanelCategories} />}
        <div className='flex-1' />
      </div>
      {showCategoryTab && (
        <div
          className={`hide-scrollbar flex min-w-full flex-1 flex-col gap-y-px overflow-y-scroll transition-transform lg:min-w-[282px] ${isPanelCategories && '-translate-x-[100%] lg:-translate-x-[280px]'
            }`}
        >
          {categories.map((category, index) => (
            <CategoryFilter key={index} category={category as MarketplaceCategoryType} />
          ))}
          <div className='flex-1' />
        </div>
      )}
    </div>
  )
}

export default Filters
