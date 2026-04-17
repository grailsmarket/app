import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { useAppDispatch } from '@/state/hooks'
import { StatusType } from '@/types/filters/name'
import { ActivityTypeFilterType } from '@/types/filters/activity'

export const useStatusFilters = () => {
  const dispatch = useAppDispatch()
  const { selectors, actions, context } = useFilterRouter()
  const statusFilter = selectors.filters.status

  const isActive = (status: StatusType | ActivityTypeFilterType) => {
    if (!statusFilter) return false
    return statusFilter.includes(status as any)
  }

  const toggleActive = (status: StatusType | ActivityTypeFilterType) => {
    return () => {
      if (isActive(status)) {
        dispatch(actions.setFiltersStatus(null))
        return
      }

      if (status === 'Grace' || status === 'Premium') {
        dispatch(actions.setSort('expiry_date_asc'))
      }

      dispatch(actions.setFiltersStatus(status as any))
    }
  }

  const getStatus = (): string => {
    if (!statusFilter || statusFilter.filter((status) => !!status).length === 0) return 'none'
    return statusFilter[0]
  }

  const setStatus = (status: string) => {
    if (status === 'none') {
      dispatch(actions.setFiltersStatus(null))
      return
    }

    if (status === 'Grace' || status === 'Premium') {
      dispatch(actions.setSort('expiry_date_asc'))
    }

    dispatch(actions.setFiltersStatus(status as any))
  }

  return {
    isActive,
    toggleActive,
    getStatus,
    setStatus,
    statusFilter,
    context,
  }
}
