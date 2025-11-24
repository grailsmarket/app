import { API_URL } from '@/constants/api'
import { authFetch } from '../authFetch'
import { APIResponseType } from '@/types/api'

export const checkPoap = async () => {
  try {
    const response = await authFetch(`${API_URL}/poap/status`, {
      method: 'GET',
    })

    const json = (await response.json()) as APIResponseType<{
      has_claimed: boolean
      link?: string
      claimed_at?: string
    }>
    if (!json.data) return { has_claimed: false }
    return json.data
  } catch (error) {
    console.error(error)
    return { has_claimed: false }
  }
}
