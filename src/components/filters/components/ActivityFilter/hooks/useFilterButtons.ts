import _ from 'lodash'

import usePosthogEvents from '@/app/hooks/usePosthogEvents'
import { useAppDispatch, useAppSelector } from '@/app/state/hooks'

import {
  clearActivityFilters,
  initialState as activityFiltersInitialState,
} from '@/app/state/reducers/filters/activityFilters'
import { selectActivityFilters } from '@/app/state/reducers/filters/activityFilters'

export const useFilterButtons = () => {
  const filters = useAppSelector(selectActivityFilters)
  const dispatch = useAppDispatch()
  const { capturePosthogEvent } = usePosthogEvents()

  const isFiltersClear = _.isEqual(filters, activityFiltersInitialState)

  const clearFilters = () => {
    dispatch(clearActivityFilters())
    capturePosthogEvent('Cleared Activity Filters')
  }

  return {
    isFiltersClear,
    clearFilters,
  }
}
