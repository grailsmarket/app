import { NextRequest, NextResponse } from 'next/server'
import { API_URL } from '@/constants/api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Forward to backend API
    const response = await fetch(`${API_URL}/brokered-listings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error creating brokered listing:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create brokered listing' },
      { status: 500 }
    )
  }
}
