'use client'

import { PersistGate } from 'redux-persist/integration/react'
import { persistor } from '@/state'
import { useAppDispatch } from '@/state/hooks'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import FilterSelector from '../FilterSelector'
import { useEffect } from 'react'

const CategoryFilterNone: React.FC = () => {
  const dispatch = useAppDispatch()
  const { selectors, actions } = useFilterRouter()
  const selectedCategories = selectors.filters.categories

  const isNoneSelected = selectedCategories?.includes('none')

  const toggleNone = () => {
    if (isNoneSelected) {
      dispatch(actions.toggleCategory('none'))
    } else {
      dispatch(actions.setFiltersCategory('none'))
    }
  }

  useEffect(() => {
    if (selectedCategories.includes('none') && selectedCategories.length > 1) {
      dispatch(actions.toggleCategory('none'))
    }
  }, [selectedCategories, dispatch, actions])

  return (
    <PersistGate persistor={persistor}>
      <div
        className='p-lg hover:bg-secondary border-tertiary w-full cursor-pointer rounded-sm border-b'
        onClick={toggleNone}
      >
        <div className='flex cursor-pointer items-center justify-between'>
          <p className='text-light-100 text-lg leading-[18px] font-medium'>None</p>
          <FilterSelector onClick={toggleNone} isActive={isNoneSelected} />
        </div>
      </div>
    </PersistGate>
  )
}

export default CategoryFilterNone
