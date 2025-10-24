import { API_URL } from '@/constants/api'
import { APIResponseType } from '@/types/api'
import { MarketplaceDomainType } from '@/types/domains'

export const fetchNameDetails = async (name: string) => {
  const response = await fetch(`${API_URL}/names/${name}`)
  const data = (await response.json()) as APIResponseType<MarketplaceDomainType>
  return data.data
}
