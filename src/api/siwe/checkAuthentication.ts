import { APIResponseType } from '@/types/api'
import { Address } from 'viem'

export type ProfileResponseType = {
  id: number
  address: Address
  email: string | null
  emailVerified: boolean
  telegram: string | null
  discord: string | null
  tier: 'free' | 'pro' | 'premium'
  tierId: number
  tierExpiresAt: string | null
  isAdmin: boolean
  createdAt: string
  lastSignIn: string
  updatedAt: string
}

export const checkAuthentication = async () => {
  const response = await fetch(`/api/users/me`, {
    method: 'GET',
  })

  const data = (await response.json()) as APIResponseType<ProfileResponseType>

  return data
}
