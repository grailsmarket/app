import { API_URL } from '@/constants/api'
import { APIResponseType, DetailsResponseType } from '@/types/api'
import { Address } from 'viem'

export const getDetails = async (user: Address) => {
  try {
    const response = await fetch(`${API_URL}/profiles/${user}`)
    const result = (await response.json()) as APIResponseType<DetailsResponseType>

    if (result.success) {
      return result.data
    }

    throw new Error(result.error?.message || 'Failed to fetch user details')
  } catch (error) {
    console.error(error)
    return null
  }
}
