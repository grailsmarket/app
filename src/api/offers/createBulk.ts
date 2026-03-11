import { API_URL } from '@/constants/api'
import { authFetch } from '@/api/authFetch'
import type { SeaportOrder } from '@/lib/seaport/bulkTypes'

interface BulkOfferItem {
  ensNameId: number
  offerAmountWei: string
  orderData: { parameters: SeaportOrder; signature: string }
  signature: string
}

interface CreateBulkOfferParams {
  offers: BulkOfferItem[]
  buyerAddress: string
  currencyAddress?: string
  expiresAt?: string
  treeHeight: number
  merkleRoot?: string
}

export interface BulkOfferResponse {
  groupId: string
  totalOffers: number
  created: number
  failed: number
  results: Array<{ ensNameId: number; status: 'success' | 'failed'; error?: string }>
  errors?: string[]
}

export const createBulkOffer = async (params: CreateBulkOfferParams): Promise<BulkOfferResponse> => {
  const response = await authFetch(`${API_URL}/offers/bulk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    throw new Error(errorData?.error?.message || errorData?.message || 'Failed to create bulk offers')
  }

  const json = await response.json()
  return json.data
}
