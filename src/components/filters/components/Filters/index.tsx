// import TypeFilter from '../TypeFilter'
import StatusFilter from '../StatusFilter'
import LengthFilter from '../LengthFilter'
import CategoryFilter from '../CategoryFilter'
import PriceRangeFilter from '../PriceRangeFilter'
import CategoryFilterTab from '../CategoryFilterTab'
import { useFilterContext } from '@/context/filters'
import { cn } from '@/utils/tailwind'
import { useIsClient } from 'ethereum-identity-kit'
import { useCategories } from '../../hooks/useCategories'
import SortFilter from '../SortFilter'
import TypeFilter from '../TypeFilter'

interface FiltersProps {
  isPanelCategories: boolean
  setPanelCategories: () => void
}

const Filters: React.FC<FiltersProps> = ({ isPanelCategories, setPanelCategories }) => {
  const { filterType, profileTab } = useFilterContext()
  const activeProfileTab = profileTab?.value || 'domains'
  const isClient = useIsClient()
  const { categories } = useCategories()

  if (!isClient) return null

  // Use appropriate categories based on filter context
  const showCategoryTab =
    filterType === 'marketplace' || activeProfileTab === 'domains' || activeProfileTab === 'watchlist' // Only show category tab for marketplace and portfolio domains tab

  return (
    <div className='flex min-h-0 flex-1 overflow-x-hidden'>
      <div
        className={cn(
          'flex min-h-0 min-w-full flex-col overflow-y-auto pb-18 transition-transform lg:min-w-[292px]',
          showCategoryTab && isPanelCategories && '-translate-x-[100%] lg:-translate-x-[292px]'
        )}
      >
        <div className='flex flex-col gap-y-2'>
          <SortFilter />
          <StatusFilter />
          <TypeFilter />
          <LengthFilter />
          <PriceRangeFilter />
          {showCategoryTab && <CategoryFilterTab setPanelCategories={setPanelCategories} />}
        </div>
      </div>
      {showCategoryTab && (
        <div
          className={cn(
            'flex min-h-0 min-w-full flex-col gap-y-px overflow-y-auto pb-18 transition-transform lg:min-w-[282px]',
            isPanelCategories && '-translate-x-[100%] lg:-translate-x-[288px]'
          )}
        >
          {categories?.map((category, index) => (
            <CategoryFilter key={index} category={category.name} owner_count={category.member_count} />
          ))}
        </div>
      )}
    </div>
  )
}

export default Filters
