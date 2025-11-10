import { PersistGate } from 'redux-persist/integration/react'
import { persistor } from '@/state'
import UnexpandedFilter from '../../components/UnexpandedFilter'
import FilterSelector from '../../components/FilterSelector'
import { PROFILE_ACTIVITY_FILTERS } from '@/constants/filters/portfolioFilters'
import {
  ActivityTypeFilterType,
  selectProfileActivityFilters,
  toggleActivityFiltersType,
} from '@/state/reducers/filters/profileActivityFilters'
import { useAppDispatch, useAppSelector } from '@/state/hooks'

const TypeFilter = () => {
  const { type: typeFilter } = useAppSelector(selectProfileActivityFilters)
  const dispatch = useAppDispatch()

  const toggleActivityFiltersTypeFn = (value: ActivityTypeFilterType) => {
    dispatch(toggleActivityFiltersType(value))
  }

  return (
    <div className='bg-dark-700 flex flex-col'>
      <PersistGate persistor={persistor} loading={<UnexpandedFilter label='Type' />}>
        <div className='w-full p-3'>
          <div className='flex w-full flex-col gap-3'>
            <p className='text-lg leading-[18px] font-medium'>Type</p>
          </div>
        </div>
        <div className='flex flex-col overflow-x-hidden'>
          {PROFILE_ACTIVITY_FILTERS.map((item, index) => (
            <div
              key={index}
              onClick={() => toggleActivityFiltersTypeFn(item.value)}
              className='hover:bg-secondary flex cursor-pointer items-center justify-between rounded-sm p-3'
            >
              <p className='text-md font-medium'>{item.label}</p>
              <FilterSelector
                isActive={typeFilter.includes(item.value)}
                onClick={() => toggleActivityFiltersTypeFn(item.value)}
              />
            </div>
          ))}
        </div>
      </PersistGate>
    </div>
  )
}

export default TypeFilter
