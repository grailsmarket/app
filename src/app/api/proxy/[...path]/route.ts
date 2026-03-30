import { NextRequest, NextResponse } from 'next/server'

const API_URL = 'https://api.grails.app/api/v1'

/**
 * Authenticated proxy to the external backend API.
 * Reads the httpOnly auth cookie and forwards it as a Bearer token,
 * so the client never needs direct access to the token.
 */
async function proxyRequest(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params
  const token = request.cookies.get('token')?.value

  const targetPath = path.join('/')
  const searchParams = request.nextUrl.searchParams.toString()
  const url = `${API_URL}/${targetPath}${searchParams ? `?${searchParams}` : ''}`

  const headers: HeadersInit = {}

  // Forward auth token if present — some endpoints work both
  // authenticated and unauthenticated (e.g., search, recommendations)
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // Forward Content-Type and Accept headers from the original request
  const contentType = request.headers.get('content-type')
  if (contentType) headers['Content-Type'] = contentType

  const accept = request.headers.get('accept')
  if (accept) headers['Accept'] = accept

  const body = request.method !== 'GET' && request.method !== 'HEAD' ? await request.text() : undefined

  const response = await fetch(url, {
    method: request.method,
    headers,
    body: body || undefined,
  })

  // Forward the response, preserving status and content type
  const responseContentType = response.headers.get('content-type') || ''
  const data = await response.arrayBuffer()

  return new NextResponse(data, {
    status: response.status,
    headers: {
      'Content-Type': responseContentType,
    },
  })
}

export const GET = proxyRequest
export const POST = proxyRequest
export const PATCH = proxyRequest
export const DELETE = proxyRequest
export const PUT = proxyRequest
