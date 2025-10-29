import { API_URL } from '@/constants/api'
import { APIResponseType, PaginationType } from '@/types/api'
import { ProfileActivityType } from '@/types/profile'

interface FetchNameActivityOptions {
  name: string
  limit: number
  pageParam: number
}

export const fetchNameActivity = async ({ name, limit, pageParam }: FetchNameActivityOptions) => {
  const response = await fetch(`${API_URL}/activity/${name}?limit=${limit}&page=${pageParam + 1}`)
  const data = (await response.json()) as APIResponseType<{
    results: ProfileActivityType[]
    pagination: PaginationType
  }>

  console.log(data)

  return {
    activity: data.data.results,
    nextPageParam: data.data.pagination.page + 1,
    hasNextPage: data.data.pagination.hasNext,
  }
}
