import { API_URL } from '@/constants/api'
import { APIResponseType } from '@/types/api'
import { MarketplaceDomainType } from '@/types/domains'
import { authFetch } from '../authFetch'

export const fetchNameDetails = async (name: string, isAuthenticated: boolean) => {
  const fetchFunction = isAuthenticated ? authFetch : fetch
  const response = await fetchFunction(`${API_URL}/names/${name}`)
  const data = (await response.json()) as APIResponseType<MarketplaceDomainType>
  return data.data
}
