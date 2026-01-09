import { API_URL } from '@/constants/api'
import { APIResponseType } from '@/types/api'
import { Address } from 'ethereum-identity-kit'

export const fetchUserCategories = async (userAddress: Address | string) => {
  const res = await fetch(`${API_URL}/clubs/counts/${userAddress}`)
  const data = (await res.json()) as APIResponseType<Record<string, number>>

  return data.data
}
