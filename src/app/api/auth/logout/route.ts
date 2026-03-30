import { NextRequest, NextResponse } from 'next/server'

const API_URL = 'https://api.grails.app/api/v1'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value

    if (!token) {
      // Even without a token, clear the cookie in case it's stale
      const res = NextResponse.json({ success: true }, { status: 200 })
      res.cookies.delete('token')
      return res
    }

    const response = await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const data = await response.json()
    const res = NextResponse.json(data, { status: response.status })

    // Clear the httpOnly auth cookie
    res.cookies.delete('token')

    return res
  } catch (error) {
    console.error('Error during logout:', error)
    // Still clear the cookie even if the backend call fails
    const res = NextResponse.json({ error: 'Failed to logout' }, { status: 500 })
    res.cookies.delete('token')
    return res
  }
}
