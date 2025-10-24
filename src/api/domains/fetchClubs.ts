import { API_URL } from '@/constants/api'
import { APIResponseType } from '@/types/api'
import { ClubType } from '@/types/domains'

export const fetchClubs = async () => {
  const res = await fetch(`${API_URL}/clubs`)
  const data = (await res.json()) as APIResponseType<{
    clubs: ClubType[]
  }>

  return data.data.clubs
}
