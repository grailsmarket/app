import { NextRequest, NextResponse } from 'next/server'

const API_URL = 'https://api.grails.app/api/v1'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get('address')

  if (!address) {
    return NextResponse.json({ error: 'Address is required' }, { status: 400 })
  }

  try {
    const response = await fetch(`${API_URL}/auth/nonce?address=${address}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching nonce:', error)
    return NextResponse.json({ error: 'Failed to fetch nonce' }, { status: 500 })
  }
}
