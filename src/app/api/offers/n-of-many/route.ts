import { NextRequest, NextResponse } from 'next/server'
import { API_URL } from '@/constants/api'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const response = await fetch(`${API_URL}/offers/n-of-many`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Error creating n-of-many offers:', error)
    return NextResponse.json({ error: 'Failed to create n-of-many offers' }, { status: 500 })
  }
}
