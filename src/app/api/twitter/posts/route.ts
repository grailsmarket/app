import { NextRequest, NextResponse } from 'next/server'

const HANDLE_REGEX = /^[A-Za-z0-9_]{1,15}$/
const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100
const X_API_BASE_URL = 'https://api.x.com/2'

type XUser = {
  id: string
  name: string
  username: string
  profile_image_url?: string
  verified?: boolean
  verified_type?: 'blue' | 'business' | 'government' | 'none'
}

type XUrlEntity = {
  start: number
  end: number
  url: string
  expanded_url?: string
  display_url?: string
  media_key?: string
}

type XMentionEntity = {
  start: number
  end: number
  username: string
}

type XTagEntity = {
  start: number
  end: number
  tag: string
}

type XTweet = {
  id: string
  text: string
  author_id?: string
  created_at?: string
  attachments?: { media_keys?: string[] }
  entities?: {
    urls?: XUrlEntity[]
    mentions?: XMentionEntity[]
    hashtags?: XTagEntity[]
    cashtags?: XTagEntity[]
  }
  public_metrics?: {
    reply_count?: number
    retweet_count?: number
    like_count?: number
    quote_count?: number
    impression_count?: number
    bookmark_count?: number
  }
}

type XMedia = {
  media_key: string
  type: 'photo' | 'video' | 'animated_gif'
  url?: string
  preview_image_url?: string
  width?: number
  height?: number
  variants?: Array<{
    bit_rate?: number
    content_type?: string
    url: string
  }>
}

type XPostsResponse = {
  data?: XTweet[]
  includes?: {
    media?: XMedia[]
    users?: XUser[]
  }
  meta?: {
    next_token?: string
    result_count?: number
  }
  errors?: Array<{ title?: string; detail?: string }>
}

type XUserResponse = {
  data?: XUser
  errors?: Array<{ title?: string; detail?: string }>
}

const jsonError = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } })

const getBestVideoUrl = (media: XMedia) => {
  const mp4Variants = media.variants?.filter((variant) => variant.content_type === 'video/mp4' && variant.url) ?? []
  if (mp4Variants.length === 0) return null

  return [...mp4Variants].sort((a, b) => (b.bit_rate ?? 0) - (a.bit_rate ?? 0))[0].url
}

const xFetch = async (path: string, params: URLSearchParams, token: string) => {
  const url = `${X_API_BASE_URL}${path}?${params.toString()}`

  return fetch(url, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    next: { revalidate: 60 },
  })
}

export async function GET(request: NextRequest) {
  const token = process.env.X_BEARER_TOKEN
  if (!token) return jsonError('X_BEARER_TOKEN is not configured', 500)

  const handle = request.nextUrl.searchParams.get('handle')?.replace(/^@/, '').trim()
  const paginationToken = request.nextUrl.searchParams.get('paginationToken')?.trim()
  const requestedLimit = Number(request.nextUrl.searchParams.get('limit') ?? DEFAULT_PAGE_SIZE)
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(Math.trunc(requestedLimit), 5), MAX_PAGE_SIZE)
    : DEFAULT_PAGE_SIZE

  if (!handle || !HANDLE_REGEX.test(handle)) return jsonError('Invalid X username', 400)

  try {
    const userParams = new URLSearchParams({
      'user.fields': 'profile_image_url,verified,verified_type',
    })
    const userResponse = await xFetch(`/users/by/username/${handle}`, userParams, token)

    if (userResponse.status === 404) return jsonError('X user not found', 404)
    if (!userResponse.ok) return jsonError(`X user lookup failed with status ${userResponse.status}`, 502)

    const userPayload = (await userResponse.json()) as XUserResponse
    const user = userPayload.data
    if (!user) return jsonError('X user lookup returned no user', 404)

    const postsParams = new URLSearchParams({
      max_results: String(limit),
      'tweet.fields': 'attachments,author_id,created_at,entities,public_metrics',
      expansions: 'attachments.media_keys,author_id',
      'media.fields': 'height,media_key,preview_image_url,type,url,variants,width',
      'user.fields': 'profile_image_url,verified,verified_type',
    })

    if (paginationToken) postsParams.set('pagination_token', paginationToken)

    const postsResponse = await xFetch(`/users/${user.id}/tweets`, postsParams, token)
    if (!postsResponse.ok) return jsonError(`X posts lookup failed with status ${postsResponse.status}`, 502)

    const postsPayload = (await postsResponse.json()) as XPostsResponse
    const mediaByKey = new Map((postsPayload.includes?.media ?? []).map((media) => [media.media_key, media]))
    const authorById = new Map(
      (postsPayload.includes?.users ?? []).map((includedUser) => [includedUser.id, includedUser])
    )

    const posts = (postsPayload.data ?? []).map((post) => {
      const author = (post.author_id && authorById.get(post.author_id)) || user
      const media =
        post.attachments?.media_keys
          ?.map((key) => mediaByKey.get(key))
          .filter((item): item is XMedia => Boolean(item))
          .map((item) => ({
            key: item.media_key,
            type: item.type,
            url: item.type === 'photo' ? item.url : getBestVideoUrl(item),
            previewImageUrl: item.preview_image_url,
            width: item.width,
            height: item.height,
          })) ?? []

      return {
        id: post.id,
        text: post.text,
        createdAt: post.created_at ?? null,
        url: `https://x.com/${author.username}/status/${post.id}`,
        author: {
          id: author.id,
          name: author.name,
          username: author.username,
          profileImageUrl: author.profile_image_url?.replace('_normal.', '_400x400.'),
          verified: Boolean(author.verified),
          verifiedType: author.verified_type ?? 'none',
        },
        entities: post.entities ?? {},
        media,
        metrics: {
          replies: post.public_metrics?.reply_count ?? 0,
          reposts: (post.public_metrics?.retweet_count ?? 0) + (post.public_metrics?.quote_count ?? 0),
          likes: post.public_metrics?.like_count ?? 0,
          views: post.public_metrics?.impression_count ?? 0,
        },
      }
    })

    return NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          profileImageUrl: user.profile_image_url?.replace('_normal.', '_400x400.'),
          verified: Boolean(user.verified),
          verifiedType: user.verified_type ?? 'none',
        },
        posts,
        nextToken: postsPayload.meta?.next_token ?? null,
      },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } }
    )
  } catch (err) {
    console.error('X posts proxy failed:', err)
    return jsonError('X posts lookup failed', 502)
  }
}
