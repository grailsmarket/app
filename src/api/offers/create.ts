import { API_URL } from '@/constants/api'
import { SeaportStoredOrder } from '@/lib/seaport/seaportClient'

interface CreateOfferParams {
  offerPriceInEth: string
  orderData: SeaportStoredOrder
  buyerAddress: string
  ensNameId: number
  durationDays: number
}

export const createOffer = async ({
  offerPriceInEth,
  orderData,
  buyerAddress,
  ensNameId,
  durationDays,
}: CreateOfferParams) => {
  const response = await fetch(`${API_URL}/offers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ensNameId,
      buyerAddress,
      offerAmountWei: offerPriceInEth,
      currencyAddress: 'WETH',
      orderData,
      expiresAt: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString(),
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to create offer')
  }

  return response.json()
}
