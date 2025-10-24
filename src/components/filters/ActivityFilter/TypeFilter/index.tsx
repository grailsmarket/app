import { PersistGate } from 'redux-persist/integration/react'
import { persistor } from '@/state'
import UnexpandedFilter from '../../components/UnexpandedFilter'
import FilterSelector from '../../components/FilterSelector'
import { PROFILE_ACTIVITY_FILTER_LABELS } from '@/constants/filters/portfolioFilters'
import {
  selectProfileActivityFilters,
  toggleActivityFiltersType,
} from '@/state/reducers/filters/profileActivityFilters'
import { useAppDispatch, useAppSelector } from '@/state/hooks'

const TypeFilter = () => {
  const { type: typeFilter } = useAppSelector(selectProfileActivityFilters)
  const dispatch = useAppDispatch()

  return (
    <div className='bg-dark-700 flex flex-col p-4'>
      <PersistGate persistor={persistor} loading={<UnexpandedFilter label='Type' />}>
        <div className='mb-6 w-full'>
          <div className='flex w-full flex-col gap-3'>
            <p className='text-lg leading-[18px] font-medium'>Type</p>
          </div>
        </div>
        <div className='flex flex-col gap-y-4 overflow-x-hidden'>
          {PROFILE_ACTIVITY_FILTER_LABELS.map((label, index) => (
            <div key={index} className='flex justify-between'>
              <p className='text-md font-medium'>{label}</p>
              <FilterSelector
                isActive={typeFilter.includes(label as any)}
                onClick={() => dispatch(toggleActivityFiltersType(label as any))}
              />
            </div>
          ))}
        </div>
      </PersistGate>
    </div>
  )
}

export default TypeFilter
