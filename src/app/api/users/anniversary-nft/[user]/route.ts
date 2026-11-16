import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@redis/client'
import { isAddress } from 'viem'
import { API_URL } from '@/constants/api'
import { APIResponseType, AuthUserType } from '@/types/api'
import { AnniversaryNftStatus } from '@/types/profile'

const getRedisClient = async () => {
  const redisClient = createClient({
    url: process.env.REDIS_URL,
  })
  redisClient.on('error', (error) => console.error('Anniversary NFT Redis error:', error))

  try {
    await redisClient.connect()
    return redisClient
  } catch (error) {
    redisClient.destroy()
    throw error
  }
}

const errorResponse = (message: string, status: number) =>
  NextResponse.json({ success: false, error: { message } }, { status })

interface RequestParams {
  params: Promise<{ user: string }>
}

export async function GET(_request: NextRequest, { params }: RequestParams) {
  const address = (await params).user
  if (!isAddress(address, { strict: false })) return errorResponse('Invalid address', 400)

  let redisClient: Awaited<ReturnType<typeof getRedisClient>> | undefined
  try {
    redisClient = await getRedisClient()
    const anniversaryNftStatus = (await redisClient.get(`anniversary-nft-${address}`)) as AnniversaryNftStatus | null

    return NextResponse.json({ address, status: anniversaryNftStatus || null })
  } catch (error) {
    console.error('Failed to read anniversary NFT status:', error)
    return errorResponse('Unable to load anniversary NFT status.', 500)
  } finally {
    redisClient?.destroy()
  }
}

export interface AnniversaryNftReqBody {
  status: AnniversaryNftStatus
}

export async function POST(request: NextRequest, { params }: RequestParams) {
  const address = (await params).user
  if (!isAddress(address, { strict: false })) return errorResponse('Invalid address', 400)

  const token = request.cookies.get('token')?.value
  if (!token) return errorResponse('Sign in to update anniversary NFT status.', 401)

  const body = (await request.json().catch(() => null)) as AnniversaryNftReqBody | null
  const status = body?.status
  if (status !== 'minted' && status !== 'dismissed') return errorResponse('Invalid anniversary NFT status.', 400)

  let redisClient: Awaited<ReturnType<typeof getRedisClient>> | undefined
  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
    }).catch(() => null)

    if (response?.status === 401 || response?.status === 403)
      return errorResponse('Sign in to update anniversary NFT status.', 401)

    if (!response?.ok) return errorResponse('Unable to verify your signed-in wallet.', 502)

    const user = (await response.json().catch(() => null)) as APIResponseType<AuthUserType> | null
    if (!user?.success || typeof user.data?.address !== 'string')
      return errorResponse('Unable to verify your signed-in wallet.', 502)

    if (user.data.address.toLowerCase() !== address.toLowerCase())
      return errorResponse('You can only update your own anniversary NFT status.', 403)

    redisClient = await getRedisClient()
    const setResponse = await redisClient.set(`anniversary-nft-${address}`, status)
    if (!setResponse) return errorResponse('Unable to save anniversary NFT status.', 500)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to save anniversary NFT status:', error)
    return errorResponse('Unable to save anniversary NFT status.', 500)
  } finally {
    redisClient?.destroy()
  }
}
