import { API_URL } from '@/constants/api'
import { authFetch } from '../authFetch'
import { APIResponseType } from '@/types/api'

export const checkPoap = async () => {
  try {
    const response = await authFetch(`${API_URL}/poap/status`, {
      method: 'GET',
    })

    const json = (await response.json()) as APIResponseType<{ has_claimed: boolean }>
    return json.data.has_claimed
  } catch (error) {
    console.error(error)
    return false
  }
}
