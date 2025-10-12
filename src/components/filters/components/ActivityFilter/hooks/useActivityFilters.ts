import { ChangeEventHandler } from 'react'

import usePosthogEvents from '@/app/hooks/usePosthogEvents'
import { useAppSelector, useAppDispatch } from '@/app/state/hooks'

import {
  ActivityTypeFilterType,
  selectActivityFilters,
  toggleActivityFiltersType,
} from '@/app/state/reducers/filters/activityFilters'

export const useActivityFilters = () => {
  const dispatch = useAppDispatch()
  const { type: typeFilter } = useAppSelector(selectActivityFilters)
  const { capturePosthogEvent } = usePosthogEvents()

  const isActive = (status: ActivityTypeFilterType) => {
    if (!typeFilter) return false
    return typeFilter.includes(status)
  }

  const toggleActive = (
    status: ActivityTypeFilterType,
  ): ChangeEventHandler<HTMLInputElement> => {
    return () => {
      dispatch(toggleActivityFiltersType(status))

      const posthogEvent = `${
        isActive(status) ? 'Removed' : 'Applied'
      } "${status}" Status`
      capturePosthogEvent(posthogEvent)
    }
  }

  return {
    isActive,
    toggleActive,
  }
}
