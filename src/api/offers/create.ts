import { TOKEN_DECIMALS } from '@/constants/web3/tokens'
import { SeaportStoredOrder } from '@/lib/seaport/seaportClient'

interface CreateOfferParams {
  marketplace: 'opensea' | 'grails'
  tokenId: string
  ensName: string
  price: number
  currency: 'WETH' | 'USDC'
  orderData: SeaportStoredOrder
  buyerAddress: string
  expiryDate: number
}

export const createOffer = async ({
  marketplace,
  tokenId,
  ensName,
  price,
  currency,
  orderData,
  buyerAddress,
  expiryDate,
}: CreateOfferParams) => {
  console.log(expiryDate)
  const fullPrice = price * Math.pow(10, TOKEN_DECIMALS[currency])

  // Call Next.js API route which handles OpenSea submission and then forwards to backend
  const response = await fetch('/api/offers/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      marketplace,
      token_id: tokenId,
      ens_name: ensName,
      buyer_address: buyerAddress,
      price_wei: fullPrice.toString(),
      currency,
      order_data: orderData,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const errorMessage = errorData.error || errorData.message || 'Failed to create offer'
    console.error('Create offer API error:', errorData)
    throw new Error(errorMessage)
  }

  return response.json()
}
