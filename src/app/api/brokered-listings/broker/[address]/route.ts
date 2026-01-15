import { NextRequest, NextResponse } from 'next/server'
import { API_URL } from '@/constants/api'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params
    const searchParams = request.nextUrl.searchParams
    const queryString = searchParams.toString()

    const url = `${API_URL}/brokered-listings/broker/${address}${queryString ? `?${queryString}` : ''}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error fetching brokered listings:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch brokered listings' },
      { status: 500 }
    )
  }
}
