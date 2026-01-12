import StatusFilter from '../StatusFilter'
import MarketFilter from '../MarketFilter'
import LengthFilter from '../LengthFilter'
import CategoryFilter from '../CategoryFilter'
import CategoryFilterAll from '../CategoryFilterAll'
import PriceRangeFilter from '../PriceRangeFilter'
import CategoryFilterTab from '../CategoryFilterTab'
import { useFilterContext } from '@/context/filters'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { cn } from '@/utils/tailwind'
import { useIsClient } from 'ethereum-identity-kit'
import { useCategories } from '../../hooks/useCategories'
import TypeFilter from '../TypeFilter'
import TextMatchFilter from '../TextMatchFilter'
import TextNonMatchFilter from '../TextNonMatchFilter'

interface FiltersProps {
  isPanelCategories: boolean
  setPanelCategories: () => void
}

const Filters: React.FC<FiltersProps> = ({ isPanelCategories, setPanelCategories }) => {
  const { filterType, profileTab, categoryTab } = useFilterContext()
  const activeProfileTab = profileTab?.value || 'domains'
  const activeCategoryTab = categoryTab?.value || 'names'
  const isClient = useIsClient()
  const { categories, userCategoryCounts } = useCategories()
  // Get marketplace tab from filter router
  const { marketplaceTab } = useFilterRouter()
  const activeMarketplaceTab = marketplaceTab?.value || 'names'

  if (!isClient) return null

  const showUserCategoryCounts =
    filterType === 'profile' &&
    (activeProfileTab === 'domains' || activeProfileTab === 'grace' || activeProfileTab === 'listings') &&
    userCategoryCounts

  // Use appropriate categories based on filter context
  const showCategoryTab =
    filterType === 'marketplace' || activeProfileTab === 'domains' || activeProfileTab === 'watchlist' // Only show category tab for marketplace and portfolio domains tab

  // Hide status filter for category and marketplace Premium and Available tabs, and profile Grace tab (status is locked for these tabs)
  const showStatusFilter = !(
    (filterType === 'category' && (activeCategoryTab === 'premium' || activeCategoryTab === 'available')) ||
    (filterType === 'marketplace' && (activeMarketplaceTab === 'premium' || activeMarketplaceTab === 'available')) ||
    (filterType === 'profile' && activeProfileTab === 'grace')
  )

  return (
    <div className='flex min-h-0 flex-1 overflow-x-hidden'>
      <div
        className={cn(
          'flex min-h-0 min-w-full flex-col overflow-y-auto pb-18 transition-transform lg:min-w-[292px]',
          showCategoryTab && isPanelCategories && '-translate-x-[100%] lg:-translate-x-[292px]'
        )}
      >
        <div className='flex flex-col'>
          {/* <SortFilter /> */}
          {showStatusFilter && <StatusFilter />}
          <MarketFilter />
          <TextMatchFilter />
          <TextNonMatchFilter />
          <LengthFilter />
          <PriceRangeFilter />
          {showCategoryTab && <CategoryFilterTab setPanelCategories={setPanelCategories} />}
          <TypeFilter />
        </div>
      </div>
      {showCategoryTab && (
        <div
          className={cn(
            'flex min-h-0 min-w-full flex-col gap-y-px overflow-y-auto pb-18 transition-transform lg:min-w-[282px]',
            isPanelCategories && '-translate-x-[100%] lg:-translate-x-[288px]'
          )}
        >
          <CategoryFilterAll
            allCategoryNames={categories?.map((c) => c.name) || []}
            totalCount={
              showUserCategoryCounts
                ? userCategoryCounts.any
                : categories?.reduce((sum, c) => sum + c.member_count, 0) || 0
            }
          />
          {categories?.map((category, index) => {
            const categoryCount = showUserCategoryCounts ? userCategoryCounts?.[category.name] : category.member_count

            return <CategoryFilter key={index} category={category.name} owner_count={categoryCount} />
          })}
        </div>
      )}
    </div>
  )
}

export default Filters
