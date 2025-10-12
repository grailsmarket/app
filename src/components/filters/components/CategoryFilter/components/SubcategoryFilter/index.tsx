import { useSubcategoryFilter } from './hooks/useSubcategoryFilter'

import FilterSelector from '../FilterSelector'

import {
  MarketplaceCategoryType,
  MarketplaceSubcategoryType,
} from '@/app/state/reducers/filters/marketplaceFilters'

import { CATEGORIES_COUNT } from '@/app/constants/domains/categoriesCount'

interface SubcategoryFilterProps {
  subcategory: MarketplaceSubcategoryType
  category: MarketplaceCategoryType
}

const SubcategoryFilter: React.FC<SubcategoryFilterProps> = ({
  subcategory,
  category,
}) => {
  const { isSubcategoryActive, toggleSubcategory } = useSubcategoryFilter(
    subcategory,
    category,
  )

  const categoryDomainsCount =
    CATEGORIES_COUNT[
      CATEGORIES_COUNT.map((c) => c.category.toLowerCase()).indexOf(
        subcategory.toLowerCase(),
      )
    ].domains

  return (
    <div className="flex items-center gap-x-2">
      <FilterSelector
        onClick={toggleSubcategory}
        isActive={isSubcategoryActive}
        isTick
      />
      <p className="text-xs font-medium leading-[18px] text-light-100">
        {subcategory}
      </p>
      <p className="text-xs font-medium leading-[18px] text-light-200">
        {categoryDomainsCount}
      </p>
    </div>
  )
}

export default SubcategoryFilter
