import { API_URL } from '@/constants/api'
import { USDC_ADDRESS, WETH_ADDRESS } from '@/constants/web3/tokens'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token_id, ens_name, buyer_address, price_wei, currency, order_data, platform } = body

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
      platform,
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
        const existingName = searchData.data.listings[0]
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

    // TODO: Submit to OpenSea if platform is 'opensea' or 'both'
    if (platform === 'opensea' || platform === 'both') {
      console.log('OpenSea offer submission not yet implemented')
    }

    return NextResponse.json(offerData)
  } catch (error: any) {
    console.error('Error creating offer:', error)
    return NextResponse.json({ error: error.message || 'Failed to create offer' }, { status: 500 })
  }
}
