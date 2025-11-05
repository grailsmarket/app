import { API_URL } from '@/constants/api'
import { APIResponseType } from '@/types/api'
import { CategoryType } from '@/types/domains'

export const fetchCategories = async () => {
  const res = await fetch(`${API_URL}/clubs`)
  const data = (await res.json()) as APIResponseType<{
    clubs: CategoryType[]
  }>

  return data.data.clubs
}
