import { API_BASE_URL } from '@/constants/analytics'
import { APIResponseType, BadgesResponseType } from '@/types/api'
import { Address } from 'viem'

export const getBadges = async (user: Address) => {
  const response = await fetch(`${API_BASE_URL}/legends/${user}/details`)
  const result = (await response.json()) as APIResponseType<BadgesResponseType>

  if (result.success) {
    return result.data.legends
  }

  return null
}
