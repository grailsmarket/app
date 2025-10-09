import { NextRequest, NextResponse } from 'next/server'

const API_URL = 'https://grails-api.ethid.org/api/v1'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, signature } = body

    const response = await fetch(`${API_URL}/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, signature }),
    })

    const data = await response.json()

    if (response.ok) {
      const res = NextResponse.json(data)
      // Set the token as an httpOnly cookie if it exists
      if (data.token) {
        res.cookies.set('token', data.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7, // 1 week
        })
      }
      return res
    }

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Error verifying signature:', error)
    return NextResponse.json({ error: 'Failed to verify signature' }, { status: 500 })
  }
}
