import { NextResponse } from 'next/server'
import { API_URL } from '@/constants/api'

export async function GET() {
  try {
    const response = await fetch(`${API_URL}/brokered-listings/config`, {
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
    console.error('Error fetching brokered listings config:', error)
    // Return a default config on error so the UI can still function
    return NextResponse.json(
      {
        success: true,
        data: {
          minFeeBasisPoints: 100,
          minFeePercent: 1,
        },
      },
      { status: 200 }
    )
  }
}
