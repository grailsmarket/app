import { PersistGate } from 'redux-persist/integration/react'
import { useCategoryFilter } from './hooks/useCategoryFilter'
import { persistor } from '@/state'
import FilterSelector from '../FilterSelector'
import { MarketplaceCategoryType } from '@/state/reducers/filters/marketplaceFilters'

interface CategoryFilterProps {
  category: MarketplaceCategoryType
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ category }) => {
  const { isCategoryActive, toggleCategory } = useCategoryFilter(category)

  return (
    <PersistGate persistor={persistor}>
      <div className='w-full p-lg rounded-sm hover:bg-secondary cursor-pointer' onClick={toggleCategory}>
        <div className='flex cursor-pointer items-center justify-between'>
          <p className='text-light-100 text-lg leading-[18px] font-medium'>{category}</p>
          <FilterSelector onClick={() => toggleCategory()} isActive={isCategoryActive} />
        </div>
      </div>
    </PersistGate>
  )
}

export default CategoryFilter
