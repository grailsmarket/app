import { NextRequest, NextResponse } from 'next/server'
import { after } from 'next/server'
import { API_URL } from '@/constants/api'
import { USDC_ADDRESS } from '@/constants/web3/tokens'
import { captureListingCreated } from '@/lib/posthog-server'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

function currencyLabel(address: unknown): string | undefined {
  if (typeof address !== 'string') return undefined
  const lower = address.toLowerCase()
  if (lower === ZERO_ADDRESS) return 'ETH'
  if (lower === USDC_ADDRESS.toLowerCase()) return 'USDC'
  return undefined
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const authorization = request.headers.get('authorization')

    // Forward to backend API
    const response = await fetch(`${API_URL}/brokered-listings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authorization ? { Authorization: authorization } : {}),
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    const sellerAddress = typeof body?.seller_address === 'string' ? body.seller_address.toLowerCase() : null
    after(() =>
      captureListingCreated({
        seller_address: sellerAddress,
        marketplace: 'grails',
        domain_count: 1,
        currencies: [currencyLabel(body?.currency_address)],
        brokered: true,
      })
    )

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error creating brokered listing:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create brokered listing' },
      { status: 500 }
    )
  }
}
