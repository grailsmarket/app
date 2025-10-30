import { PersistGate } from 'redux-persist/integration/react'
import { useCategoryFilter } from './hooks/useCategoryFilter'
import { persistor } from '@/state'
import FilterSelector from '../FilterSelector'
import { CLUB_LABELS } from '@/constants/domains/marketplaceDomains'

interface CategoryFilterProps {
  category: string
  owner_count: number
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ category, owner_count }) => {
  const { isCategoryActive, toggleCategory } = useCategoryFilter(category)

  const clubLabel = CLUB_LABELS[category as keyof typeof CLUB_LABELS]
  return (
    <PersistGate persistor={persistor}>
      <div className='p-lg hover:bg-secondary w-full cursor-pointer rounded-sm' onClick={toggleCategory}>
        <div className='flex cursor-pointer items-center justify-between'>
          <p className='text-light-100 text-lg leading-[18px] font-medium capitalize'>{clubLabel}</p>
          <div className='flex items-center gap-x-2'>
            <p className='text-light-200 text-xs leading-[18px] font-medium'>{owner_count}</p>
            <FilterSelector onClick={() => toggleCategory()} isActive={isCategoryActive} />
          </div>
        </div>
      </div>
    </PersistGate>
  )
}

export default CategoryFilter
