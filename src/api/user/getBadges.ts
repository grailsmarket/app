import { API_URL } from '@/constants/api'
import { APIResponseType, BadgesResponseType } from '@/types/api'
import { Address } from 'viem'

export const getBadges = async (user: Address) => {
  const response = await fetch(`${API_URL}/legends/${user}/details`)
  const result = (await response.json()) as APIResponseType<BadgesResponseType>

  if (result.success) {
    return result.data.legends
  }

  return null
}
