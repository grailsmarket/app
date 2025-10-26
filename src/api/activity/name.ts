import { API_URL } from '@/constants/api'
import { PaginationType } from '@/types/api'
import { ProfileActivityType } from '@/types/profile'

interface FetchNameActivityOptions {
  name: string
  limit: number
  pageParam: number
}

export const fetchNameActivity = async ({ name, limit, pageParam }: FetchNameActivityOptions) => {
  const response = await fetch(`${API_URL}/activity/${name}?limit=${limit}&page=${pageParam}`)
  const data = (await response.json()) as {
    data: ProfileActivityType[]
    pagination: PaginationType
  }

  return {
    activity: data.data,
    nextPageParam: data.pagination.page + 1,
    hasNextPage: data.pagination.hasNext,
  }
}
