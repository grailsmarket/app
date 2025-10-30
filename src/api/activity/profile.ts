import { API_URL } from '@/constants/api'
import { ActivityTypeFilterType } from '@/state/reducers/filters/profileActivityFilters'
import { APIResponseType, PaginationType } from '@/types/api'
import { ProfileActivityType } from '@/types/profile'
import { Address } from 'viem'

interface FetchProfileActivityOptions {
  address: Address
  limit: number
  pageParam: number
  eventTypes: ActivityTypeFilterType[]
}

export const fetchProfileActivity = async ({ address, limit, pageParam, eventTypes }: FetchProfileActivityOptions) => {
  console.log(eventTypes)
  const typeFilter = eventTypes.join('&event_type=')
  const response = await fetch(
    `${API_URL}/activity/address/${address}?limit=${limit}&page=${pageParam + 1}&event_type=${typeFilter}`
  )
  const data = (await response.json()) as APIResponseType<{
    results: ProfileActivityType[]
    pagination: PaginationType
  }>

  return {
    activity: data.data.results,
    nextPageParam: data.data.pagination.page + 1,
    hasNextPage: data.data.pagination.hasNext,
  }
}
