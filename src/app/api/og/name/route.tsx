import { ImageResponse } from 'next/og'
import { NextRequest, NextResponse } from 'next/server'
import { APP_ENS_ADDRESS } from '@/constants'
import { ENS_NAME_WRAPPER_ADDRESS } from '@/constants/web3/contracts'
import { labelhash, namehash } from 'viem'

const size = {
  width: 800,
  height: 418,
}

const PROBE_TIMEOUT_MS = 750

const ENS_METADATA_URL = process.env.ENS_METADATA_URL || 'https://ens-metadata-flarecloud.encrypted-063.workers.dev'
const WRAPPED_DOMAIN_IMAGE_URL = `${ENS_METADATA_URL}/mainnet/${ENS_NAME_WRAPPER_ADDRESS}`
export const UNWRAPPED_DOMAIN_IMAGE_URL = `${ENS_METADATA_URL}/mainnet/${APP_ENS_ADDRESS}`

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const name = decodeURIComponent(searchParams.get('name') || '')

  if (name === '') {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  if (name.replace('.eth', '').length < 3) {
    return NextResponse.json({ error: 'Invalid ENS name' }, { status: 400 })
  }

  const getENSImage = async () => {
    try {
      const nameHash = namehash(name)
      const labelHash = labelhash(name.replace('.eth', ''))

      const wrappedImageUrl = `${WRAPPED_DOMAIN_IMAGE_URL}/${nameHash}/image`
      const unwrappedImageUrl = `${UNWRAPPED_DOMAIN_IMAGE_URL}/${labelHash}/image`

      const wrappedResult = await fetch(wrappedImageUrl, {
        signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
      })
        .then((res) => res.ok)
        .catch(() => false)

      return wrappedResult ? wrappedImageUrl : unwrappedImageUrl
    } catch (error) {
      console.error('Error fetching ENS Image:', error)
      return null
    }
  }

  const ensImage = await getENSImage()

  try {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            background: 'radial-gradient(circle, #444444, #222222)',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 40,
            fontFamily: 'Inter, sans-serif',
            color: '#f4f4f4',
            fontWeight: 700,
          }}
        >
          {ensImage && (
            <img
              src={ensImage}
              alt='ens'
              width={281}
              height={281}
              style={{
                borderRadius: 16,
                marginRight: 16,
              }}
            />
          )}
          <div style={{ height: 80, width: 2, backgroundColor: '#ffffff' }} />
          <img src='https://grails.app/your-ens-market-logo.svg' alt='Grails Logo' width={232} height={71} />
        </div>
      ),
      {
        ...size,
        emoji: 'twemoji',
        headers: {
          'Cache-Control': 'public, max-age=604800, s-maxage=604800, stale-while-revalidate=86400',
          'CDN-Cache-Control': 'max-age=604800',
          'Vercel-CDN-Cache-Control': 'max-age=604800',
        },
      }
    )
  } catch (error) {
    console.error('Error generating image:', error)
    return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 })
  }
}
