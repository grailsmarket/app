import { API_URL } from '@/constants/api'
import { TOKEN_ADDRESSES, TOKEN_DECIMALS } from '@/constants/web3/tokens'
import { SeaportStoredOrder } from '@/lib/seaport/seaportClient'

interface CreateOfferParams {
  marketplace: 'opensea' | 'grails'
  ensNameId: number
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
  ensNameId,
  price,
  currency,
  orderData,
  buyerAddress,
  expiryDate,
}: CreateOfferParams) => {
  console.log(expiryDate)
  const currencyAddress = TOKEN_ADDRESSES[currency]
  const fullPrice = price * Math.pow(10, TOKEN_DECIMALS[currency])

  // Call Next.js API route which handles OpenSea submission and then forwards to backend
  const response = await fetch(`${API_URL}/offers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      marketplace,
      ensNameId,
      buyerAddress: buyerAddress.toLowerCase(),
      offerAmountWei: fullPrice.toString(),
      currencyAddress: currencyAddress.toLowerCase(),
      orderData,
      expiresAt: new Date(expiryDate * 1000).toISOString(),
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to create Grails offer')
  }

  return response.json()
}

export const submitOfferToOpenSea = async (order_data: any) => {
  const OPENSEA_API_URL = process.env.NEXT_PUBLIC_OPENSEA_API_URL
  const OPENSEA_API_KEY = process.env.NEXT_PUBLIC_OPENSEA_API_KEY

  if (!OPENSEA_API_KEY) {
    throw new Error('OPENSEA_API_KEY not configured')
  }

  const { parameters, signature, protocol_data } = order_data

  // Use protocol_data if available, otherwise use top-level parameters
  const orderParameters = protocol_data?.parameters || parameters
  const orderSignature = protocol_data?.signature || signature

  if (!orderParameters || !orderSignature) {
    throw new Error('Missing order parameters or signature')
  }

  // Build the OpenSea API payload for offers
  const payload = {
    parameters: {
      offerer: orderParameters.offerer,
      zone: orderParameters.zone,
      offer: orderParameters.offer,
      consideration: orderParameters.consideration,
      orderType: orderParameters.orderType,
      startTime: orderParameters.startTime?.toString(),
      endTime: orderParameters.endTime?.toString(),
      zoneHash: orderParameters.zoneHash,
      salt: orderParameters.salt?.toString(),
      conduitKey: orderParameters.conduitKey,
      totalOriginalConsiderationItems: orderParameters.totalOriginalConsiderationItems?.toString(),
      counter: orderParameters.counter?.toString(),
    },
    signature: orderSignature,
    protocol_address: process.env.NEXT_PUBLIC_SEAPORT_ADDRESS || '0x0000000000000068F116a894984e2DB1123eB395',
  }

  const url = `${OPENSEA_API_URL}/v2/orders/ethereum/seaport/offers`
  console.log('Submitting offer to OpenSea:', {
    url,
    offerer: payload.parameters.offerer,
    offerItems: payload.parameters.offer?.length,
    considerationItems: payload.parameters.consideration?.length,
    hasSignature: !!payload.signature,
  })
  console.log('Full OpenSea offer payload:', JSON.stringify(payload, null, 2))

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': OPENSEA_API_KEY,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('OpenSea API error response:', {
      status: response.status,
      statusText: response.statusText,
      error: errorText,
    })

    // Try to parse error as JSON for better error message
    let errorMessage = errorText
    try {
      const errorJson = JSON.parse(errorText)
      errorMessage = errorJson.message || errorJson.error || errorText
    } catch (e) {
      console.error('Error parsing OpenSea API error:', e)
      // Use raw error text if not JSON
    }

    throw new Error(`OpenSea API error (${response.status}): ${errorMessage}`)
  }

  const result = await response.json()
  console.log('OpenSea API response:', result)
  return result
}
