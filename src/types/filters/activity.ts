import { ACTIVITY_TYPE_FILTERS } from '@/constants/filters/activity'

export type ActivityTypeFilterType = (typeof ACTIVITY_TYPE_FILTERS)[number]['value']

export type ActivityFiltersState = {
  type: ActivityTypeFilterType[]
}

export type ActivityFiltersOpenedState = ActivityFiltersState & {
  open: boolean
  scrollTop: number
}
