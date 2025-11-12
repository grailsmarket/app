import { API_URL } from '@/constants/api'
import { authFetch } from '../authFetch'
import { APIResponseType } from '@/types/api'

export const claimPoap = async () => {
  try {
    const response = await authFetch(`${API_URL}/poap/claim`, {
      method: 'POST',
    })

    const json = (await response.json()) as APIResponseType<{ link: string }>
    console.log(json)
    return json.data.link
  } catch (error) {
    console.error(error)
    return null
  }
}
