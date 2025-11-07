import { API_URL } from '@/constants/api'
import { TOKEN_ADDRESSES, TOKEN_DECIMALS } from '@/constants/web3/tokens'
import { SeaportStoredOrder } from '@/lib/seaport/seaportClient'

interface CreateOfferParams {
  marketplace: 'opensea' | 'grails'
  price: number
  currency: 'WETH' | 'USDC'
  orderData: SeaportStoredOrder
  buyerAddress: string
  ensNameId: number
  expiryDate: number
}

export const createOffer = async ({
  marketplace,
  price,
  currency,
  orderData,
  buyerAddress,
  ensNameId,
  expiryDate,
}: CreateOfferParams) => {
  console.log(expiryDate)
  const currencyAddress = TOKEN_ADDRESSES[currency]
  const fullPrice = price * Math.pow(10, TOKEN_DECIMALS[currency])

  const response = await fetch(`${API_URL}/offers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      marketplace,
      ensNameId,
      buyerAddress,
      offerAmountWei: fullPrice.toString(),
      currencyAddress,
      orderData,
      expiresAt: new Date(expiryDate * 1000).toISOString(),
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to create offer')
  }

  return response.json()
}
