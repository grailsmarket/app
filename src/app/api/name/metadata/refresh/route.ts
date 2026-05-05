import { normalizeName } from '@/lib/ens'
import { NextRequest, NextResponse } from 'next/server'

const CACHE_INVALIDATION_TOKEN =
  process.env.ENS_METADATA_CACHE_INVALIDATION_TOKEN || process.env.CACHE_INVALIDATION_TOKEN
const ENS_METADATA_URL =
  process.env.ENS_METADATA_URL ||
  process.env.NEXT_PUBLIC_ENS_METADATA_URL ||
  'https://ens-metadata-flarecloud.encrypted-063.workers.dev'

export async function POST(request: NextRequest) {
  if (!CACHE_INVALIDATION_TOKEN) {
    return NextResponse.json({ error: 'Metadata cache invalidation is not configured' }, { status: 503 })
  }

  const body = (await request.json().catch(() => null)) as { name?: unknown } | null
  let name: string | null = null

  try {
    name = typeof body?.name === 'string' ? normalizeName(body.name) : null
  } catch {
    return NextResponse.json({ error: 'Invalid name' }, { status: 400 })
  }

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const response = await fetch(`${ENS_METADATA_URL}/cache/invalidate`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${CACHE_INVALIDATION_TOKEN}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      items: [
        {
          network: 'mainnet',
          name,
        },
      ],
    }),
  })

  if (!response.ok) {
    const error = await response.text().catch(() => '')
    return NextResponse.json({ error: error || 'Failed to refresh metadata cache' }, { status: response.status })
  }

  const data = await response.json().catch(() => null)
  return NextResponse.json(data ?? { ok: true })
}
