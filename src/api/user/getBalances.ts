import { API_URL } from '@/constants/api'
import { APIResponseType, BalancesResponseType } from '@/types/api'
import { Address } from 'viem'

export const getBalances = async (user: Address) => {
  const response = await fetch(`${API_URL}/users/${user}/balances`)
  const result = (await response.json()) as APIResponseType<BalancesResponseType>

  if (result.success) {
    return result.data.balances
  }

  return null
}
