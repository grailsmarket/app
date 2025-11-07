import { API_URL } from '@/constants/api'
import { USDC_ADDRESS, WETH_ADDRESS } from '@/constants/web3/tokens'
import { NextRequest, NextResponse } from 'next/server'

const OPENSEA_API_URL = process.env.OPENSEA_API_URL || 'https://api.opensea.io'
const OPENSEA_API_KEY = process.env.OPENSEA_API_KEY

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token_id, ens_name, buyer_address, price_wei, currency, order_data, marketplace, platform } = body

    // Support both 'marketplace' (from frontend) and 'platform' (legacy) parameters
    const offerMarketplace = marketplace || platform || 'grails'

    // Normalize address to lowercase
    const normalizedBuyerAddress = buyer_address ? buyer_address.toLowerCase() : null

    // Convert currency name to address
    let currencyAddress = WETH_ADDRESS // Default to WETH
    if (currency === 'USDC') {
      currencyAddress = USDC_ADDRESS
    } else if (currency === 'WETH') {
      currencyAddress = WETH_ADDRESS
    }

    console.log('Offer create request:', {
      token_id,
      ens_name,
      buyer_address: normalizedBuyerAddress,
      price_wei: price_wei,
      currency,
      currencyAddress,
      marketplace: offerMarketplace,
      order_data,
    })

    if (!token_id || !normalizedBuyerAddress || !price_wei || !order_data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // First, get or create the ENS name in the database
    let ensNameId: number

    // Try to find existing ENS name
    const searchResponse = await fetch(`${API_URL}/listings/search?q=${ens_name}&showAll=true&limit=1`)
    if (searchResponse.ok) {
      const searchData = await searchResponse.json()
      if (searchData.success && searchData.data.listings.length > 0) {
        // Name exists, get the ID from the listings search
        // const existingName = searchData.data.listings[0]
        // We need to query the ens_names table to get the ID
        // For now, we'll use The Graph to get name details
      }
    }

    // Fetch ENS name details from The Graph
    const subgraphResponse = await fetch('https://api.thegraph.com/subgraphs/name/ensdomains/ens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          query GetDomain($name: String!) {
            domains(where: { name: $name }) {
              id
              name
              labelhash
              owner {
                id
              }
              registrant {
                id
              }
            }
          }
        `,
        variables: {
          name: ens_name.toLowerCase(),
        },
      }),
    })

    const subgraphData = await subgraphResponse.json()
    console.log('Subgraph response:', JSON.stringify(subgraphData, null, 2))
    const domain = subgraphData?.data?.domains?.[0]

    if (!domain) {
      console.error('ENS name not found in subgraph. ENS name:', ens_name, 'Response:', subgraphData)
      return NextResponse.json({ error: 'ENS name not found' }, { status: 404 })
    }

    // Get or create ENS name in database
    const ensNameResponse = await fetch(`${API_URL}/names/${ens_name}`)
    if (!ensNameResponse.ok) {
      // Create the ENS name if it doesn't exist
      const createNameResponse = await fetch(`${API_URL}/names`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: domain.name,
          tokenId: token_id,
          ownerAddress: domain.owner?.id || domain.registrant?.id,
        }),
      })

      if (!createNameResponse.ok) {
        throw new Error('Failed to create ENS name')
      }

      const createNameData = await createNameResponse.json()
      console.log('Create ENS name data:', createNameData)
      ensNameId = createNameData.data.id
    } else {
      const ensNameData = await ensNameResponse.json()
      console.log('ENS name data:', ensNameData)
      ensNameId = ensNameData.data.id
    }

    console.log('ENS name ID:', ensNameId)

    // Calculate expiration from order data
    let expiresAt: string | undefined
    if (order_data.parameters?.endTime) {
      expiresAt = new Date(parseInt(order_data.parameters.endTime) * 1000).toISOString()
    }

    // Create the offer
    const offerResponse = await fetch(`${API_URL}/offers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        marketplace: offerMarketplace,
        ensNameId,
        buyerAddress: normalizedBuyerAddress,
        offerAmountWei: price_wei,
        currencyAddress: currencyAddress.toLowerCase(), // WETH or USDC address
        orderData: order_data,
        expiresAt,
      }),
    })

    if (!offerResponse.ok) {
      const errorText = await offerResponse.text()
      throw new Error(`Failed to create offer: ${errorText}`)
    }

    const offerData = await offerResponse.json()

    // Submit to OpenSea if marketplace is 'opensea' or 'both'
    let openSeaSubmissionError = null
    if (offerMarketplace === 'opensea' || offerMarketplace === 'both') {
      try {
        await submitOfferToOpenSea(order_data)
        console.log('Successfully submitted offer to OpenSea')
      } catch (openSeaError: any) {
        console.error('Failed to submit offer to OpenSea:', openSeaError)
        openSeaSubmissionError = openSeaError.message || String(openSeaError)

        // If offer ONLY to OpenSea, fail the request
        if (offerMarketplace === 'opensea') {
          return NextResponse.json(
            {
              error: `Failed to submit offer to OpenSea: ${openSeaSubmissionError}`,
              details: 'Please check that the order parameters are correct and you have sufficient balance.',
            },
            { status: 500 }
          )
        }
        // For "both", we'll continue and save to our DB, but include warning in response
      }
    }

    // If there was an OpenSea error during cross-marketplace offer, include it in response
    if (openSeaSubmissionError && offerMarketplace === 'both') {
      return NextResponse.json({
        ...offerData,
        warning: `Offer saved to Grails marketplace, but failed to submit to OpenSea: ${openSeaSubmissionError}`,
      })
    }

    return NextResponse.json(offerData)
  } catch (error: any) {
    console.error('Error creating offer:', error)
    return NextResponse.json({ error: error.message || 'Failed to create offer' }, { status: 500 })
  }
}

/**
 * Submit a Seaport offer to OpenSea's API
 */
async function submitOfferToOpenSea(order_data: any) {
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
