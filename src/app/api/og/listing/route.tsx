import { ImageResponse } from 'next/og'
import { NextRequest, NextResponse } from 'next/server'
import { APP_ENS_ADDRESS } from '@/constants'
import { ENS_NAME_WRAPPER_ADDRESS } from '@/constants/web3/contracts'
import { labelhash, namehash, isAddress } from 'viem'
import { formatUnits } from 'viem'
import { truncateAddress as truncateAddr, fetchAccount } from 'ethereum-identity-kit/utils'
import { TOKENS } from '@/constants/web3/tokens'
import { beautifyName } from '@/lib/ens'
import { CATEGORY_LABELS } from '@/constants/domains/marketplaceDomains'
import { APIResponseType } from '@/types/api'
import { MarketplaceDomainType } from '@/types/domains'
import { API_URL } from '@/constants/api'
import { getInterFonts } from '../_lib/inter'

const size = {
  width: 1600,
  height: 836,
}

const ENS_METADATA_URL = process.env.ENS_METADATA_URL || 'https://ens-metadata-flarecloud.encrypted-063.workers.dev'
const WRAPPED_DOMAIN_IMAGE_URL = `${ENS_METADATA_URL}/mainnet/${ENS_NAME_WRAPPER_ADDRESS}`
const UNWRAPPED_DOMAIN_IMAGE_URL = `${ENS_METADATA_URL}/mainnet/${APP_ENS_ADDRESS}`

const SOURCE_LOGO_URLS: Record<string, string> = {
  opensea: 'https://grails.app/logos/opensea.svg',
  grails: 'https://grails.app/logo.svg',
  ensvision: 'https://grails.app/logos/ensvision.svg',
}

const formatPrice = (priceWei: string, currencyAddress: string): string => {
  const isUSDC = currencyAddress.toLowerCase() === '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
  const decimals = isUSDC ? 6 : 18
  const value = parseFloat(formatUnits(BigInt(priceWei), decimals))

  if (value >= 1000) {
    return value.toLocaleString('en-US', { maximumFractionDigits: 0 })
  }

  return value.toLocaleString('en-US', { maximumFractionDigits: 4 })
}

const formatExpiryDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const getCurrencySymbol = (currencyAddress: string): string => {
  const address = currencyAddress.toLowerCase()
  const token = TOKENS[address as keyof typeof TOKENS]
  return token || 'ETH'
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const name = searchParams.get('name')
    const listing_id = searchParams.get('listing_id')

    if (!name || !listing_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const getNameDetails = async () => {
      try {
        const response = await fetch(`${API_URL}/names/${name}`)
        const result = (await response.json()) as APIResponseType<MarketplaceDomainType>
        const data = result.data

        return {
          listings: data.listings,
          owner_address: data.owner,
          categories: data.clubs || [],
        }
      } catch (error) {
        console.error('Error fetching name details:', error)
        return null
      }
    }

    const nameDetails = await getNameDetails()

    if (!nameDetails) {
      return NextResponse.json({ error: 'Name details not found' }, { status: 404 })
    }

    const listing = nameDetails.listings.find((listing) => listing.id === parseInt(listing_id))
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    const owner_address = nameDetails.owner_address
    if (!owner_address) {
      return NextResponse.json({ error: 'Owner address not found' }, { status: 404 })
    }

    const categories = nameDetails.categories
    const price = formatPrice(listing.price, listing.currency_address)
    const currency = getCurrencySymbol(listing.currency_address)
    const sourceLogo = SOURCE_LOGO_URLS[listing.source] || SOURCE_LOGO_URLS.grails
    const expiresFormatted = formatExpiryDate(listing.expires_at)
    const displayName = name.endsWith('.eth') ? name : `${name}.eth`
    const defaultAvatar = 'https://efp.app/assets/art/default-avatar.svg'
    const getOwnerProfile = async () => {
      if (!nameDetails.owner_address) return { avatar: defaultAvatar, displayName: '' }
      try {
        const response = await fetchAccount(nameDetails.owner_address)
        if (response === null) {
          return {
            avatar: defaultAvatar,
            displayName: isAddress(owner_address) ? truncateAddr(owner_address as `0x${string}`) : owner_address,
          }
        }
        return {
          avatar: response.ens?.avatar || defaultAvatar,
          displayName: response.ens?.name || truncateAddr(owner_address as `0x${string}`),
        }
      } catch (error) {
        console.error('Error fetching owner profile:', error)
        return {
          avatar: defaultAvatar,
          displayName: isAddress(owner_address) ? truncateAddr(owner_address as `0x${string}`) : owner_address,
        }
      }
    }

    const getENSImage = async () => {
      try {
        const nameHash = namehash(displayName)
        const labelHash = labelhash(displayName.replace('.eth', ''))

        const wrappedImageUrl = `${WRAPPED_DOMAIN_IMAGE_URL}/${nameHash}/image`
        const unwrappedImageUrl = `${UNWRAPPED_DOMAIN_IMAGE_URL}/${labelHash}/image`

        const wrappedResult = await fetch(wrappedImageUrl)
          .then((res) => res.ok)
          .catch(() => false)

        return wrappedResult ? wrappedImageUrl : unwrappedImageUrl
      } catch (error) {
        console.error('Error fetching ENS Image:', error)
        return null
      }
    }

    // Sniff the image format from the actual bytes. The `content-type` header often
    // lies (wrong type, extra params like `; charset=...`), and Satori's decoder will
    // throw `RangeError: Offset is outside the bounds of the DataView` if the MIME in
    // the data URI prefix doesn't match the bytes.
    const detectImageMime = (bytes: Uint8Array): string | null => {
      if (bytes.length < 4) return null
      // PNG: 89 50 4E 47
      if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png'
      // JPEG: FF D8 FF
      if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg'
      // GIF: 47 49 46 38
      if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) return 'image/gif'
      // WebP: "RIFF....WEBP"
      if (
        bytes.length >= 12 &&
        bytes[0] === 0x52 &&
        bytes[1] === 0x49 &&
        bytes[2] === 0x46 &&
        bytes[3] === 0x46 &&
        bytes[8] === 0x57 &&
        bytes[9] === 0x45 &&
        bytes[10] === 0x42 &&
        bytes[11] === 0x50
      )
        return 'image/webp'
      // SVG: text starting with <?xml or <svg
      const head = new TextDecoder()
        .decode(bytes.slice(0, Math.min(bytes.length, 256)))
        .trimStart()
        .toLowerCase()
      if (head.startsWith('<?xml') || head.startsWith('<svg')) return 'image/svg+xml'
      return null
    }

    const fetchImageAsDataUri = async (url: string): Promise<string | null> => {
      try {
        const res = await fetch(url)
        if (!res.ok) return null
        const buffer = await res.arrayBuffer()
        if (buffer.byteLength === 0) return null
        const mime = detectImageMime(new Uint8Array(buffer))
        if (!mime) return null
        const base64 = Buffer.from(buffer).toString('base64')
        return `data:${mime};base64,${base64}`
      } catch {
        return null
      }
    }

    // Pre-fetch category avatars as base64 data URIs for reliable rendering in Satori
    const getCategoryAvatarDataUris = async (): Promise<Record<string, string>> => {
      if (categories.length !== 1) return {}
      const entries = await Promise.all(
        categories.map(async (category) => {
          const dataUri = await fetchImageAsDataUri(`https://api.grails.app/api/v1/clubs/${category}/avatar`)
          return [category, dataUri || ''] as const
        })
      )
      return Object.fromEntries(entries)
    }

    const [ownerProfile, ensImage, categoryAvatars, interFonts, defaultAvatarDataUri] = await Promise.all([
      getOwnerProfile(),
      getENSImage(),
      getCategoryAvatarDataUris(),
      getInterFonts(),
      fetchImageAsDataUri(defaultAvatar),
    ])

    const ownerAvatarDataUri = ownerProfile.displayName
      ? await fetchImageAsDataUri(`${ENS_METADATA_URL}/mainnet/avatar/${ownerProfile.displayName}`)
      : null
    const ownerAvatar = ownerAvatarDataUri || (defaultAvatarDataUri as string)

    const imageBottomRadius = categories.length > 0 ? 0 : 20

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
            gap: 80,
            padding: 80,
            color: '#f4f4f4',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 560,
                height: 96,
                fontSize: 60,
                fontWeight: 700,
                color: '#222222',
                backgroundColor: '#ffdfc0',
                textTransform: 'uppercase',
                letterSpacing: 1,
                borderRadius: '20px 20px 0px 0px',
              }}
            >
              LISTING
            </div>
            {ensImage && (
              <img
                src={ensImage}
                alt='ens'
                width={560}
                height={560}
                style={{
                  borderTopLeftRadius: 0,
                  borderTopRightRadius: 0,
                  borderBottomLeftRadius: imageBottomRadius,
                  borderBottomRightRadius: imageBottomRadius,
                  objectFit: 'cover',
                }}
              />
            )}
            {categories.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 560,
                  gap: 24,
                  overflow: 'hidden',
                  backgroundColor: '#444444',
                  borderRadius: '0px 0px 20px 20px',
                  padding: categories.length === 1 ? '16px' : '10px',
                }}
              >
                {categories.length === 1 ? (
                  <div
                    key={categories[0]}
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 16,
                    }}
                  >
                    {categoryAvatars[categories[0]] && (
                      <img
                        src={categoryAvatars[categories[0]]}
                        alt='category'
                        width={64}
                        height={64}
                        style={{ borderRadius: 32, objectFit: 'cover' }}
                      />
                    )}
                    <div
                      style={{
                        fontSize: 44,
                        color: '#ffffff',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {CATEGORY_LABELS[categories[0] as keyof typeof CATEGORY_LABELS] || categories[0]}
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: 44, color: '#ffffff', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {categories.length} Categories
                  </p>
                )}
              </div>
            )}
          </div>
          <div style={{ height: 480, width: 3, backgroundColor: '#cccccc', borderRadius: 8 }} />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 24,
              maxWidth: 700,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
              <div style={{ fontSize: 96, fontWeight: 700, color: '#ffdfc0' }}>{`${price} ${currency}`}</div>
              <img src={sourceLogo} alt='source' width={72} height={72} />
            </div>
            <div style={{ fontSize: 48, color: '#cccccc' }}>{`Ends: ${expiresFormatted}`}</div>
            {ownerProfile.displayName && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 24,
                  marginTop: 8,
                  padding: '8px 0px',
                }}
              >
                <img
                  src={ownerAvatar}
                  alt='owner'
                  width={80}
                  height={80}
                  style={{ borderRadius: 40, objectFit: 'cover' }}
                />
                <div
                  style={{
                    fontSize: 48,
                    color: '#cccccc',
                    maxWidth: 560,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {ownerProfile.displayName}
                </div>
              </div>
            )}
            <div
              style={{
                fontSize: 44,
                color: '#ffdfc0',
                maxWidth: 700,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {`grails.app/${beautifyName(name)}`}
            </div>
            <img
              src='https://grails.app/your-ens-market-logo.svg'
              alt='Grails'
              width={380}
              height={116}
              style={{ marginTop: 24 }}
            />
          </div>
        </div>
      ),
      {
        ...size,
        emoji: 'twemoji',
        headers: {
          'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
        },
        fonts: interFonts,
      }
    )
  } catch (error) {
    console.error('Error generating listing image:', error)
    return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 })
  }
}
