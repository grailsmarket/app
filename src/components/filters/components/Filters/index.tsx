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
    <div className='flex w-full overflow-x-hidden pb-10'>
      <div
        className={cn(
          'flex min-w-full flex-col gap-y-2 pb-16 transition-transform lg:min-w-[284px]',
          showCategoryTab && isPanelCategories && '-translate-x-[100%] lg:-translate-x-[284px]'
        )}
      >
        <SortFilter />
        <StatusFilter />
        {/* <TypeFilter /> */}
        <LengthFilter />
        <PriceRangeFilter />
        {showCategoryTab && <CategoryFilterTab setPanelCategories={setPanelCategories} />}
      </div>
      {showCategoryTab && (
        <div
          className={`hide-scrollbar flex min-w-full flex-1 flex-col gap-y-px overflow-y-hidden transition-transform lg:min-w-[282px] ${
            isPanelCategories && '-translate-x-[100%] lg:-translate-x-[280px]'
          }`}
        >
          {categories?.map((category, index) => (
            <CategoryFilter key={index} category={category.name} owner_count={category.member_count} />
          ))}
          <div className='flex-1' />
        </div>
      )}
    </div>
  )
}

export default Filters
