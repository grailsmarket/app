import { ImageResponse } from 'next/og'
import { NextRequest, NextResponse } from 'next/server'
import { renderEnsNftImage } from '../_lib/ensNftImage'

const size = {
  width: 800,
  height: 418,
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const name = decodeURIComponent(searchParams.get('name') || '')
  const tokenId = decodeURIComponent(searchParams.get('tokenId') || '')

  if (name === '') {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  if (name.replace('.eth', '').length < 3) {
    return NextResponse.json({ error: 'Invalid ENS name' }, { status: 400 })
  }

  try {
    return new ImageResponse(
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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 281,
            height: 281,
            borderRadius: 16,
            marginRight: 16,
            position: 'relative',
          }}
        >
          {/* if name image req comes back with nothing, it stys blank which gives room for fallbacks below */}
          {renderEnsNftImage({
            name,
            tokenId,
            width: 281,
            height: 281,
            style: {
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              borderRadius: 16,
              marginRight: 16,
            }
          })}
        </div>
        <div style={{ height: 80, width: 2, backgroundColor: '#ffffff' }} />
        <img src='https://grails.app/your-ens-market-logo.svg' alt='Grails Logo' width={232} height={71} />
      </div>,
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
