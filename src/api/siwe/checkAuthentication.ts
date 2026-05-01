import { APIResponseType } from '@/types/api'
import { Address } from 'viem'

export type ProfileResponseType = {
  id: number
  address: Address
  email: string | null
  emailVerified: boolean
  telegram: string | null
  discord: string | null
  createdAt: string
  lastSignIn: string
  updatedAt: string
  minOfferThreshold: number | null
  notifyOnListingSold: boolean
  notifyOnOfferReceived: boolean
  notifyOnCommentReceived: boolean
}

export const checkAuthentication = async () => {
  const response = await fetch(`/api/users/me`, {
    method: 'GET',
  })

  const data = (await response.json()) as APIResponseType<ProfileResponseType>

  return data
}
