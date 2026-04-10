import type { NOfManyOfferResponse } from '@/lib/seaport/bulkTypes'

interface CreateNOfManyOfferParams {
  buyerAddress: string
  offerAmountWei: string
  tokenIds: string[]
  targetCount: number
  merkleRoot: string
  orderData: any[]
  signatures: string[]
  orderHashes?: string[]
  treeHeight: number
  currencyAddress?: string
  expiresAt?: string
}

export const createNOfManyOffer = async (params: CreateNOfManyOfferParams): Promise<NOfManyOfferResponse> => {
  const response = await fetch(`/api/offers/n-of-many`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    throw new Error(errorData?.error?.message || errorData?.message || 'Failed to create n-of-many offers')
  }

  const json = await response.json()
  return json.data
}
