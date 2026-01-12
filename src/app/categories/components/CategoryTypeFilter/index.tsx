'use client'

import { PersistGate } from 'redux-persist/integration/react'
import { persistor } from '@/state'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { selectCategoriesPageFilters, toggleCategoriesPageType } from '@/state/reducers/filters/categoriesPageFilters'
import {
  CATEGORIES_PAGE_TYPE_OPTIONS,
  CATEGORIES_PAGE_TYPE_LABELS,
  CategoriesPageTypeOption,
} from '@/constants/filters/categoriesPageFilters'
import FilterSelector from '@/components/filters/components/FilterSelector'
import ExpandableTab from '@/components/ui/expandableTab'
import UnexpandedFilter from '@/components/filters/components/UnexpandedFilter'
import { useFilterOpen } from '@/components/filters/hooks/useFilterOpen'

const CategoryTypeFilter: React.FC = () => {
  const dispatch = useAppDispatch()
  const { open, toggleOpen } = useFilterOpen('Type')
  const filters = useAppSelector(selectCategoriesPageFilters)
  const selectedType = filters.type

  const toggleType = (type: CategoriesPageTypeOption) => {
    dispatch(toggleCategoriesPageType(type))
  }

  // Calculate expanded height based on number of options
  const expandedHeight = 56 + CATEGORIES_PAGE_TYPE_OPTIONS.length * 44

  return (
    <PersistGate persistor={persistor} loading={<UnexpandedFilter label='Type' />}>
      <ExpandableTab open={open} toggleOpen={toggleOpen} expandedHeight={expandedHeight} label='Type'>
        <div className='flex flex-col'>
          {CATEGORIES_PAGE_TYPE_OPTIONS.map((type) => {
            const isSelected = selectedType === type
            return (
              <div
                key={type}
                className='hover:bg-secondary flex w-full cursor-pointer items-center justify-between rounded-sm px-4 py-3'
                onClick={() => toggleType(type)}
              >
                <p className='text-light-100 text-lg font-medium'>{CATEGORIES_PAGE_TYPE_LABELS[type]}</p>
                <FilterSelector onClick={() => toggleType(type)} isActive={isSelected} isRadio />
              </div>
            )
          })}
        </div>
      </ExpandableTab>
    </PersistGate>
  )
}

export default CategoryTypeFilter
