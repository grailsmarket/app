import { NextRequest, NextResponse } from 'next/server'

const API_URL = 'https://api.grails.app/api/v1'

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
      // The backend returns { data: { token, user } } — extract the nested token
      const token = data?.data?.token
      if (token) {
        res.cookies.set('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
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
