import Image from 'next/image'
import { PersistGate } from 'redux-persist/integration/react'

import { useFilterOpen } from '../../hooks/useFilterOpen'
import { useCategoryFilter } from './hooks/useCategoryFilter'

import { persistor } from '@/app/state'
import FilterSelector from './components/FilterSelector'
import SubcategoryFilter from './components/SubcategoryFilter'

import { MarketplaceCategoryType } from '@/app/state/reducers/filters/marketplaceFilters'

import { CATEGORIES_COUNT } from '@/app/constants/domains/categoriesCount'

import chevronUp from '../../../../../../public/svg/navigation/chevron-up.svg'

interface CategoryFilterProps {
  category: MarketplaceCategoryType
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ category }) => {
  const { open, toggleOpen } = useFilterOpen()

  const {
    relevantSubcategories,
    subcategoryFilterHeight,
    isCategoryActive,
    toggleCategory,
  } = useCategoryFilter(category)

  const categoryDomainsCount =
    CATEGORIES_COUNT[
      CATEGORIES_COUNT.map((c) => c.category.toLowerCase()).indexOf(
        category.toLowerCase(),
      )
    ].domains

  return (
    <PersistGate persistor={persistor}>
      <div className="w-full bg-dark-700 p-4">
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
              <p className="text-xs font-medium leading-[18px] text-light-200">
                {categoryDomainsCount}
              </p>
            </div>

            <div className="flex items-center gap-x-4">
              <p className="text-[10px] text-light-200 opacity-30">0</p>
              <Image
                src={chevronUp}
                alt="chevron up"
                className={`transition-all ${open ? '' : 'rotate-180'}`}
              />
            </div>
          </div>
          <div className="mb-4 mt-4 h-px w-full bg-dark-500" />
          <div className="flex flex-col gap-y-5">
            {relevantSubcategories.map((subcategory, index) => (
              <SubcategoryFilter
                key={index}
                subcategory={subcategory}
                category={category}
              />
            ))}
          </div>
        </div>
      </div>
    </PersistGate>
  )
}

export default CategoryFilter
