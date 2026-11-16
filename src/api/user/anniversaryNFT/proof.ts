import { config } from '@/lib/config'
import { APIResponseType } from '@/types/api'
import { Address, Hex } from 'viem'

export type ProofResponse = {
  address: Address
  eligible: boolean
  tokenId: number
  type: string
  proof: Address[]
  merkleRoot: Hex
}

export const getProof = async (address: Address) => {
  try {
    const req = await fetch(`${config.grailsApiUrl}/anniversary/proof/${address}`, {
      cache: 'default',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    })

    const data = (await req.json()) as APIResponseType<ProofResponse>
    return data
  } catch (e) {
    console.error(e)
    return {
      success: false,
      data: null,
      meta: {
        timestamp: new Date().toISOString(),
        version: 'unknown',
      },
    }
  }
}
