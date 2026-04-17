'use client'

import { PersistGate } from 'redux-persist/integration/react'
import { persistor } from '@/state'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { selectCategoriesPageFilters, toggleCategoriesPageType } from '@/state/reducers/filters/categoriesPageFilters'
import FilterSelector from '@/components/filters/components/FilterSelector'
import UnexpandedFilter from '@/components/filters/components/UnexpandedFilter'
import { useCategories } from '@/components/filters/hooks/useCategories'
import { useMemo } from 'react'
import LoadingCell from '@/components/ui/loadingCell'
import { CategoriesPageTypeOption } from '@/types/filters/categories'

const CategoryTypeFilter: React.FC = () => {
  const dispatch = useAppDispatch()
  const { categories, categoriesLoading } = useCategories()
  const filters = useAppSelector(selectCategoriesPageFilters)
  const selectedType = filters.type

  const toggleType = (type: CategoriesPageTypeOption) => {
    dispatch(toggleCategoriesPageType(type))
  }

  const categoryTypes = useMemo(() => {
    const catTypeSet = new Set<CategoriesPageTypeOption>()
    categories?.forEach((category) => {
      category.classifications.forEach((classification) => {
        catTypeSet.add(classification as CategoriesPageTypeOption)
      })
    })
    return Array.from(catTypeSet)
  }, [categories])

  // Calculate expanded height based on number of options
  const expandedHeight = 56 + categoryTypes.length * 44

  return (
    <PersistGate persistor={persistor} loading={<UnexpandedFilter label='Type' />}>
      <div className='border-tertiary w-full border-b'>
        <div className='flex h-auto w-full flex-col py-1.5 transition-all'>
          <div className='flex flex-col'>
            {categoriesLoading ? (
              <div className='flex flex-col gap-2'>
                {Array.from({ length: 9 }).map((_, index) => (
                  <div key={index} className='px-lg py-md'>
                    <LoadingCell width='100%' height='22px' />
                  </div>
                ))}
              </div>
            ) : (
              categoryTypes.map((type) => {
                const isSelected = selectedType === type
                return (
                  <div
                    key={type}
                    className='hover:bg-secondary flex w-full cursor-pointer items-center justify-between rounded-sm px-4 py-3'
                    onClick={() => toggleType(type)}
                  >
                    <p className='text-light-100 text-lg font-medium capitalize'>{type === 'ai' ? 'AI' : type}</p>
                    <FilterSelector onClick={() => toggleType(type)} isActive={isSelected} isRadio />
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </PersistGate>
  )
}

export default CategoryTypeFilter
