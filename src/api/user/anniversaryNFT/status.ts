import { AnniversaryNftStatus } from '@/types/profile'
import { Address } from 'viem'

export type StatusResponse = {
  address: Address
  status: AnniversaryNftStatus
}

export const getStatus = async (address: Address) => {
  try {
    const req = await fetch(`/api/users/anniversary-nft/${address}`, {
      method: 'GET',
      cache: 'default',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    })

    const data = (await req.json()) as StatusResponse
    return data
  } catch (e) {
    console.error(e)
    return {
      address,
      status: null,
    }
  }
}

type StatusRequest = StatusResponse

export const setStatus = async ({ address, status }: StatusRequest) => {
  try {
    const req = await fetch(`/api/users/anniversary-nft/${address}`, {
      method: 'POST',
      cache: 'default',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ status }),
    })

    const data = (await req.json()) as boolean
    return data
  } catch (e) {
    console.error(e)
    return false
  }
}
