import { API_BASE_URL } from '@/constants/analytics'
import { APIResponseType } from '@/types/api'
import { Resolver } from '@/types/ens'
import { Address } from 'viem'

interface GetUserResolversParams {
  userAddress: Address
}

export const getUserResolvers = async ({ userAddress }: GetUserResolversParams) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userAddress}/resolvers`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const result = (await response.json()) as APIResponseType<{ resolvers: Resolver[] }>
    return result.data.resolvers
  } catch (error) {
    console.error(error)
    throw error
  }
}
