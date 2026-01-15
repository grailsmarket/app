import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { REGISTERED, UNREGISTERED } from '@/constants/domains/registrationStatuses'
import { getRegistrationStatus } from '@/utils/getRegistrationStatus'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ens_beautify } from '@adraffy/ens-normalize'

const size = {
  width: 1024,
  height: 1024,
}

// Gradient definitions based on the CSS classes
const gradients = {
  'gradient-blue': 'linear-gradient(331.79deg, #44bcf1 2.57%, #628bf2 65.63%, #a099fe 149.86%)',
  'gradient-gray': 'linear-gradient(135deg, rgba(129, 133, 152) 0%, rgba(231, 237, 246) 103.11%)',
}

function getGradient(expiryDate: string | null) {
  const registrationStatus = getRegistrationStatus(expiryDate)

  if (registrationStatus === REGISTERED) return gradients['gradient-blue']
  if (registrationStatus === UNREGISTERED) return gradients['gradient-gray']

  return gradients['gradient-blue']
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const name = searchParams.get('name') || 'Unknown'
    const expires = searchParams.get('expires')
    const expiryDate = expires ? new Date(Number(expires)).toISOString() : null

    const gradient = getGradient(expiryDate)

    const satoshiBold = await readFile(join(process.cwd(), 'public/fonts/satoshi/Satoshi-Black.otf'))

    return new ImageResponse(
      (
        <div
          style={{
            background: gradient,
            width: '1024px',
            height: '1024px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            padding: '128px',
            paddingRight: '0px',
            position: 'relative',
          }}
        >
          {/* ENS Logo */}
          <svg width='204px' height='228px' viewBox='0 0 32 36' fill='none' xmlns='http://www.w3.org/2000/svg'>
            <g filter='url(#filter0_d_2374_14748)'>
              <path
                d='M5.65355 8.55037C5.94537 7.99299 6.36642 7.5178 6.8798 7.16676L15.494 1L6.66766 15.9623C6.66766 15.9623 5.8965 14.6262 5.59564 13.9502C5.2209 13.1002 5.03187 12.1765 5.04186 11.2437C5.05184 10.3109 5.26065 9.39167 5.65355 8.55037ZM2.09834 18.8718C2.19561 20.3026 2.58994 21.6956 3.25498 22.9575C3.91992 24.2195 4.84027 25.3212 5.95431 26.1889L15.4824 33C15.4824 33 9.52103 24.1926 4.49292 15.4287C3.98382 14.5028 3.6416 13.4904 3.48262 12.4402C3.41225 11.9646 3.41225 11.4808 3.48262 11.0052C3.35149 11.2543 3.09704 11.7642 3.09704 11.7642C2.58718 12.8301 2.23992 13.97 2.06743 15.1441C1.96816 16.385 1.97853 17.6327 2.09834 18.8718ZM26.391 20.0576C26.0825 19.3817 25.319 18.0455 25.319 18.0455L16.5081 33L25.1224 26.8372C25.6357 26.4861 26.0568 26.011 26.3486 25.4536C26.7415 24.6122 26.9502 23.693 26.9603 22.7603C26.9703 21.8275 26.7813 20.9037 26.4064 20.0537L26.391 20.0576ZM29.8883 15.1321C29.7911 13.7014 29.3967 12.3083 28.7318 11.0464C28.0667 9.78448 27.1464 8.68274 26.0324 7.81512L16.5196 1C16.5196 1 22.4771 9.80737 27.5093 18.5713C28.0169 19.4975 28.3578 20.5098 28.5157 21.5598C28.586 22.0354 28.586 22.5192 28.5157 22.9948C28.6468 22.7457 28.9012 22.2358 28.9012 22.2358C29.4111 21.1699 29.7584 20.03 29.9307 18.8559C30.0313 17.615 30.0223 16.3674 29.9038 15.1282L29.8883 15.1321Z'
                fill='white'
              />
            </g>
            <defs>
              <filter
                id='filter0_d_2374_14748'
                x='0'
                y='0'
                width='32'
                height='36'
                filterUnits='userSpaceOnUse'
                color-interpolation-filters='sRGB'
              >
                <feFlood flood-opacity='0' result='BackgroundImageFix' />
                <feColorMatrix
                  in='SourceAlpha'
                  type='matrix'
                  values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0'
                  result='hardAlpha'
                />
                <feOffset dy='1' />
                <feGaussianBlur stdDeviation='1' />
                <feComposite in2='hardAlpha' operator='out' />
                <feColorMatrix type='matrix' values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0' />
                <feBlend mode='normal' in2='BackgroundImageFix' result='effect1_dropShadow_2374_14748' />
                <feBlend mode='normal' in='SourceGraphic' in2='effect1_dropShadow_2374_14748' result='shape' />
              </filter>
            </defs>
          </svg>

          {/* Domain Name */}
          <p
            style={{
              color: 'white',
              fontSize: name.length > 30 ? '80px' : name.length > 20 ? '64px' : name.length > 14 ? '84px' : '108px',
              fontWeight: 700,
              textAlign: 'left',
              maxWidth: '92.5%',
              wordBreak: 'break-word',
              textShadow: '0 4px 8px rgba(0,0,0,0.2)',
              fontFamily:
                'Satoshi, AppleColorEmoji, Segoe UI Emoji, Segoe UI Symbol, Apple Color Emoji, Noto Color Emoji, sans-serif',
              lineClamp: 5,
              WebkitLineClamp: 5,
              WebkitBoxOrient: 'vertical',
              display: '-webkit-box',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {ens_beautify(name)}
          </p>
        </div>
      ),
      {
        ...size,
        fonts: [
          {
            name: 'Satoshi',
            data: satoshiBold,
            weight: 700,
            style: 'normal' as const,
          },
        ],
        headers: {
          'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
          'CDN-Cache-Control': 'max-age=31536000',
        },
      }
    )
  } catch (e: any) {
    console.error(`Failed to generate ENS name image: ${e.message}`)

    // Return a default error image
    return new ImageResponse(
      (
        <div
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            width: '1024px',
            height: '1024px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '32px',
            fontWeight: 'bold',
          }}
        >
          ENS Name
        </div>
      ),
      {
        ...size,
        headers: {
          'Cache-Control': 'public, max-age=3600', // Cache error images for 1 hour
        },
      }
    )
  }
}
