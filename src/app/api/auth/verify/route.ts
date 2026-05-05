import { NextRequest, NextResponse } from 'next/server'
import { createPostHogServerClient } from '@/lib/posthog-server'

const API_URL = 'https://api.grails.app/api/v1'

async function captureAuthVerified(properties: {
  address: string | null
  success: boolean
  status?: number
  failure_reason?: string
}) {
  const posthog = createPostHogServerClient()
  if (!posthog) return
  try {
    posthog.capture({
      distinctId: properties.address?.toLowerCase() ?? 'anonymous',
      event: 'auth_verified',
      properties: {
        success: properties.success,
        status: properties.status,
        failure_reason: properties.failure_reason,
        $process_person_profile: false,
      },
    })
    await posthog.shutdown(2000)
  } catch (err) {
    console.error('analytics failed:', err)
  }
}

export async function POST(request: NextRequest) {
  let address: string | null = null
  try {
    const body = await request.json()
    const { message, signature } = body

    const addressMatch = typeof message === 'string' ? message.match(/0x[a-fA-F0-9]{40}/) : null
    address = addressMatch?.[0] ?? null

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
      await captureAuthVerified({ address, success: true, status: response.status })
      return res
    }

    await captureAuthVerified({
      address,
      success: false,
      status: response.status,
      failure_reason: typeof data?.error === 'string' ? data.error : 'upstream_error',
    })
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Error verifying signature:', error)
    await captureAuthVerified({ address, success: false, failure_reason: 'exception' })
    return NextResponse.json({ error: 'Failed to verify signature' }, { status: 500 })
  }
}
