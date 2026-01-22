'use client'

import { PersistGate } from 'redux-persist/integration/react'
import { persistor } from '@/state'
import { useAppDispatch } from '@/state/hooks'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import FilterSelector from '../FilterSelector'
import { useEffect } from 'react'
import { API_URL } from '@/constants/api'
import { buildQueryParamString } from '@/utils/api/buildQueryParamString'
import { useQuery } from '@tanstack/react-query'
import { APIResponseType, PaginationType } from '@/types/api'
import { MarketplaceDomainType } from '@/types/domains'
import { useFilterContext } from '@/context/filters'
import { localizeNumber } from '@/utils/localizeNumber'

interface CategoryFilterNoneProps {
  showUserCategoryCounts: boolean
}

const CategoryFilterNone: React.FC<CategoryFilterNoneProps> = ({ showUserCategoryCounts }) => {
  const dispatch = useAppDispatch()
  const { profileAddress } = useFilterContext()
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

  const { data: totalNamesCount } = useQuery({
    queryKey: ['totalNamesCount', profileAddress],
    queryFn: async () => {
      const filterUrl = buildQueryParamString({
        'filters[clubs][]': ['none'],
        'filters[owner]': profileAddress,
      })

      const res = await fetch(`${API_URL}/search?${filterUrl}`)
      const data = (await res.json()) as APIResponseType<{
        names: MarketplaceDomainType[]
        results: MarketplaceDomainType[]
        pagination: PaginationType
      }>
      return data.data.pagination.total
    },
    enabled: !!profileAddress && showUserCategoryCounts,
  })

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
          <div className='flex items-center gap-x-2'>
            {showUserCategoryCounts && (
              <p className='text-light-200 text-xs leading-[18px] font-medium'>{localizeNumber(totalNamesCount || 0)}</p>
            )}
            <FilterSelector onClick={toggleNone} isActive={isNoneSelected} />
          </div>
        </div>
      </div>
    </PersistGate>
  )
}

export default CategoryFilterNone
