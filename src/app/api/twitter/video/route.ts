import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_HOSTS = new Set(['video.twimg.com'])
const PASS_THROUGH_HEADERS = [
  'content-type',
  'content-length',
  'content-range',
  'accept-ranges',
  'last-modified',
  'etag',
]

const jsonError = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } })

export async function GET(request: NextRequest) {
  const target = request.nextUrl.searchParams.get('url')
  if (!target) return jsonError('Missing url parameter', 400)

  let parsed: URL
  try {
    parsed = new URL(target)
  } catch {
    return jsonError('Invalid url parameter', 400)
  }

  if (parsed.protocol !== 'https:' || !ALLOWED_HOSTS.has(parsed.hostname)) {
    return jsonError('Forbidden upstream host', 400)
  }

  const upstreamHeaders: Record<string, string> = {}
  const range = request.headers.get('range')
  if (range) upstreamHeaders.Range = range

  let upstream: Response
  try {
    upstream = await fetch(parsed.toString(), { headers: upstreamHeaders, redirect: 'follow' })
  } catch (err) {
    console.error('Twitter video proxy fetch failed:', err)
    return jsonError('Upstream fetch failed', 502)
  }

  if (!upstream.ok && upstream.status !== 206) {
    return jsonError(`Upstream returned ${upstream.status}`, 502)
  }

  const responseHeaders = new Headers()
  for (const name of PASS_THROUGH_HEADERS) {
    const value = upstream.headers.get(name)
    if (value) responseHeaders.set(name, value)
  }
  responseHeaders.set('Cache-Control', 'public, max-age=3600, s-maxage=3600')

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  })
}
