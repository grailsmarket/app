import { EFP_API_URL, ENSProfile } from 'ethereum-identity-kit'
import { Address } from 'viem'

export interface FollowingRequest {
  limit: number
  offset: number
  addressOrName: Address | string
  search?: string
}

export interface FollowingResponse {
  ens: ENSProfile
  address: Address
  tags: string[]
  version: number
  record_type: 'address'
}

export const getUserFollowing = async ({ limit, offset, addressOrName, search }: FollowingRequest) => {
  const isSearch = search && search.length >= 2

  const endpoint = isSearch ? 'searchFollowing' : 'following'

  const response = await fetch(
    `${EFP_API_URL}/users/${addressOrName}/${endpoint}?include=ens&limit=${limit}&offset=${offset * limit}${isSearch ? `&term=${search}` : ''}`
  )

  const data = (await response.json()) as { following: FollowingResponse[] }
  return data.following
}
