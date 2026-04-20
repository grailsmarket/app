import { ImageResponse } from 'next/og'
import { NextRequest, NextResponse } from 'next/server'
import { APP_ENS_ADDRESS } from '@/constants'
import { ENS_NAME_WRAPPER_ADDRESS } from '@/constants/web3/contracts'
import { labelhash, namehash, isAddress } from 'viem'
import { formatUnits } from 'viem'
import { truncateAddress, fetchAccount } from 'ethereum-identity-kit/utils'
import { beautifyName } from '@/lib/ens'
import { CATEGORY_LABELS } from '@/constants/domains/marketplaceDomains'
import { API_URL } from '@/constants/api'
import { APIResponseType } from '@/types/api'
import { DomainOfferType } from '@/types/domains'
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
  if (address === '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48') return 'USDC'
  if (address === '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2') return 'WETH'
  return 'WETH'
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const name = searchParams.get('name')
    const offer_id = searchParams.get('offer_id')
    const owner_address = searchParams.get('owner')
    const categories = searchParams.get('categories')?.split(',') || []

    if (!name || !offer_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const getOfferDetails = async () => {
      try {
        const response = await fetch(`${API_URL}/offers/${offer_id}`)
        const data = (await response.json()) as APIResponseType<DomainOfferType>
        const offer = data.data

        return {
          offer,
          expires: offer.expires_at,
          offerrer_address: offer.buyer_address,
          source: offer.source,
          currencyAddress: offer.currency_address,
          amountWei: offer.offer_amount_wei,
        }
      } catch (error) {
        console.error('Error fetching name details:', error)
        return null
      }
    }

    const offerDetails = await getOfferDetails()
    if (!offerDetails) {
      return NextResponse.json({ error: 'Offer details not found' }, { status: 404 })
    }

    const { expires, offerrer_address, source, currencyAddress, amountWei } = offerDetails
    if (!name || !amountWei || !currencyAddress || !source || !expires) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const amount = formatPrice(amountWei, currencyAddress)
    const currency = getCurrencySymbol(currencyAddress)
    const sourceLogo = SOURCE_LOGO_URLS[source] || SOURCE_LOGO_URLS.grails
    const expiresFormatted = formatExpiryDate(expires)
    const displayName = name.endsWith('.eth') ? name : `${name}.eth`
    const defaultAvatar = 'https://efp.app/assets/art/default-avatar.svg'

    const getOwnerProfile = async () => {
      if (!owner_address) return { avatar: defaultAvatar, displayName: '' }
      try {
        const response = await fetchAccount(owner_address)
        if (response === null) {
          return {
            avatar: defaultAvatar,
            displayName: isAddress(owner_address) ? truncateAddress(owner_address as `0x${string}`) : owner_address,
          }
        }
        return {
          avatar: response.ens?.avatar || defaultAvatar,
          displayName: response.ens?.name || truncateAddress(owner_address as `0x${string}`),
        }
      } catch (error) {
        console.error('Error fetching owner profile:', error)
        return {
          avatar: defaultAvatar,
          displayName: isAddress(owner_address) ? truncateAddress(owner_address as `0x${string}`) : owner_address,
        }
      }
    }

    const getOfferrerProfile = async () => {
      if (!offerrer_address) return { avatar: defaultAvatar, displayName: '' }
      try {
        const response = await fetchAccount(offerrer_address)
        if (response === null) {
          return {
            avatar: defaultAvatar,
            displayName: isAddress(offerrer_address)
              ? truncateAddress(offerrer_address as `0x${string}`)
              : offerrer_address,
          }
        }
        return {
          avatar: response.ens?.avatar || defaultAvatar,
          displayName: response.ens?.name || truncateAddress(offerrer_address as `0x${string}`),
        }
      } catch (error) {
        console.error('Error fetching offerrer profile:', error)
        return {
          avatar: defaultAvatar,
          displayName: isAddress(offerrer_address)
            ? truncateAddress(offerrer_address as `0x${string}`)
            : offerrer_address,
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
      if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png'
      if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg'
      if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) return 'image/gif'
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

    // Metadata avatar endpoint expects an actual ENS name; truncated addresses won't resolve.
    const avatarUrlForProfile = (profile: { avatar: string; displayName: string }) =>
      profile.displayName.endsWith('.eth')
        ? `${ENS_METADATA_URL}/mainnet/avatar/${profile.displayName}`
        : profile.avatar

    const [ownerProfile, offerrerProfile, ensImage, categoryAvatars, interFonts] = await Promise.all([
      getOwnerProfile(),
      getOfferrerProfile(),
      getENSImage(),
      getCategoryAvatarDataUris(),
      getInterFonts(),
    ])

    const [ownerAvatarDataUri, offerrerAvatarDataUri, defaultAvatarDataUri] = await Promise.all([
      fetchImageAsDataUri(avatarUrlForProfile(ownerProfile)),
      fetchImageAsDataUri(avatarUrlForProfile(offerrerProfile)),
      fetchImageAsDataUri(defaultAvatar),
    ])

    const ownerAvatar = ownerAvatarDataUri || defaultAvatarDataUri
    const offerrerAvatar = offerrerAvatarDataUri || defaultAvatarDataUri

    const imageBottomRadius = categories.length > 0 ? 0 : 20

    const renderPartyRow = (label: string, avatar: string | null, displayName: string) => (
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-start',
          maxWidth: 740,
          gap: 16,
        }}
      >
        <div style={{ fontSize: 42, color: '#cccccc', fontWeight: 600 }}>{label}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {avatar && (
            <img src={avatar} alt='party' width={80} height={80} style={{ borderRadius: 40, objectFit: 'cover' }} />
          )}
          <div
            style={{
              fontSize: 48,
              color: '#cccccc',
              maxWidth: 520,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {displayName}
          </div>
        </div>
      </div>
    )

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
            padding: 70,
            fontFamily: 'Inter, sans-serif',
            color: '#f4f4f4',
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
                color: '#ffffff',
                backgroundColor: '#ED34E7',
                textTransform: 'uppercase',
                letterSpacing: 1,
                borderRadius: '20px 20px 0px 0px',
              }}
            >
              OFFER
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
                    {`${categories.length} Categories`}
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
              maxWidth: 720,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
              <div style={{ fontSize: 96, fontWeight: 700, color: '#ffdfc0' }}>{`${amount} ${currency}`}</div>
              <img src={sourceLogo} alt='source' width={72} height={72} />
            </div>
            <div style={{ fontSize: 48, color: '#cccccc', paddingBottom: 8 }}>{`Ends: ${expiresFormatted}`}</div>
            {offerrerProfile?.displayName && renderPartyRow('Bidder:', offerrerAvatar, offerrerProfile.displayName)}
            {ownerProfile.displayName && renderPartyRow('Owner:', ownerAvatar, ownerProfile.displayName)}
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
        fonts: interFonts,
        headers: {
          'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
        },
      }
    )
  } catch (error) {
    console.error('Error generating offer image:', error)
    return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 })
  }
}
