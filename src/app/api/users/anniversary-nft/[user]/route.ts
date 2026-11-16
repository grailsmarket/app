import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@redis/client'
import { AnniversaryNftStatus } from '@/types/profile'

const getRedisClient = async () => {
  const redisClient = await createClient({
    url: process.env.REDIS_URL,
  }).connect()
  return redisClient
}

interface RequestParams {
  params: Promise<{ user: string }>
}

export async function GET(request: NextRequest, { params }: RequestParams) {
  const address = (await params).user
  if (!address)
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Invalid address',
        },
      },
      {
        status: 500,
      }
    )

  const redisClient = await getRedisClient()
  const anniversaryNftStatus = (await redisClient.get(`anniversary-nft-${address}`)) as AnniversaryNftStatus | null
  redisClient.destroy()

  return NextResponse.json({
    address,
    status: anniversaryNftStatus || null,
  })
}

export interface AnniversaryNftReqBody {
  status: AnniversaryNftStatus
}

export async function POST(request: NextRequest, { params }: RequestParams) {
  const address = (await params).user
  const body = (await request.json()) as AnniversaryNftReqBody
  const status = body.status

  const redisClient = await getRedisClient()
  const setResponse = await redisClient.set(`anniversary-nft-${address}`, status)
  redisClient.destroy()

  if (!setResponse)
    return NextResponse.json(
      {
        success: false,
        error: {
          message: `Could not insert status ${status} for address ${address} into Redis storage`,
        },
      },
      {
        status: 500,
        statusText: 'Failed to insert data',
      }
    )

  return NextResponse.json(
    {
      success: true,
    },
    {
      status: 200,
    }
  )
}
