import { PersistGate } from 'redux-persist/integration/react'
import { useCategoryFilter } from './hooks/useCategoryFilter'
import { persistor } from '@/state'
import FilterSelector from '../FilterSelector'
import { localizeNumber } from '@/utils/localizeNumber'

interface CategoryFilterProps {
  category: string
  categoryName: string
  owner_count: number
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ category, categoryName, owner_count }) => {
  const { isCategoryActive, toggleCategory } = useCategoryFilter(category)

  return (
    <PersistGate persistor={persistor}>
      <div className='p-lg hover:bg-secondary w-full cursor-pointer rounded-sm' onClick={toggleCategory}>
        <div className='flex cursor-pointer items-center justify-between'>
          <p className='text-light-100 text-lg leading-[18px] font-medium capitalize'>{categoryName}</p>
          <div className='flex items-center gap-x-2'>
            <p className='text-light-200 text-xs leading-[18px] font-medium'>{localizeNumber(owner_count)}</p>
            <FilterSelector onClick={() => toggleCategory()} isActive={isCategoryActive} />
          </div>
        </div>
      </div>
    </PersistGate>
  )
}

export default CategoryFilter
