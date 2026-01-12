'use client'

import { PersistGate } from 'redux-persist/integration/react'
import { persistor } from '@/state'
import { useAppDispatch } from '@/state/hooks'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import FilterSelector from '../FilterSelector'

interface CategoryFilterAllProps {
  allCategoryNames: string[]
  totalCount: number
}

const CategoryFilterAll: React.FC<CategoryFilterAllProps> = ({ allCategoryNames, totalCount }) => {
  const dispatch = useAppDispatch()
  const { selectors, actions } = useFilterRouter()
  const selectedCategories = selectors.filters.categories || []

  // Check if all categories are selected
  const areAllSelected =
    allCategoryNames.length > 0 && allCategoryNames.every((cat) => selectedCategories.includes(cat))

  const toggleAll = () => {
    if (areAllSelected) {
      selectedCategories.forEach((cat) => {
        dispatch(actions.toggleCategory(cat))
      })
    } else {
      allCategoryNames.forEach((cat) => {
        if (!selectedCategories.includes(cat)) {
          dispatch(actions.toggleCategory(cat))
        }
      })
    }
  }

  return (
    <PersistGate persistor={persistor}>
      <div className='p-lg hover:bg-secondary w-full cursor-pointer rounded-sm' onClick={toggleAll}>
        <div className='flex cursor-pointer items-center justify-between'>
          <p className='text-light-100 text-lg leading-[18px] font-medium'>All</p>
          <div className='flex items-center gap-x-2'>
            <p className='text-light-200 text-xs leading-[18px] font-medium'>{totalCount}</p>
            <FilterSelector onClick={toggleAll} isActive={areAllSelected} />
          </div>
        </div>
      </div>
    </PersistGate>
  )
}

export default CategoryFilterAll
