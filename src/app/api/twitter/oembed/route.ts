import { NextRequest, NextResponse } from 'next/server'

// Twitter handles: 1–15 characters, alphanumeric + underscore only.
const HANDLE_REGEX = /^[A-Za-z0-9_]{1,15}$/
const ONE_HOUR_SECONDS = 60 * 60
const ONE_WEEK_SECONDS = 7 * 24 * 60 * 60

interface OEmbedResponse {
  url: string
  html: string
  author_name?: string
  author_url?: string
  cache_age?: string
  type: string
  version: string
}

/**
 * Server-side proxy for Twitter's oEmbed API. Fetching from our origin lets
 * Next.js cache the response per handle (default revalidate: 1 hour) so repeat
 * widget mounts hit our cache instead of `publish.twitter.com`.
 *
 * Twitter recommends this endpoint over `widgets.js` discovery for production
 * deployments and serves responses with `cache_age` set very high — they want
 * us to cache aggressively.
 *
 * The response HTML is just the `.twitter-timeline` anchor (we always pass
 * `omit_script=true`); the client loads `widgets.js` itself and calls
 * `widgets.load()` on the injected anchor to render the iframe.
 */
export async function GET(request: NextRequest) {
  const handle = request.nextUrl.searchParams.get('handle')
  if (!handle || !HANDLE_REGEX.test(handle)) {
    return NextResponse.json({ error: 'Invalid handle' }, { status: 400 })
  }

  const upstreamParams = new URLSearchParams({
    url: `https://twitter.com/${handle}`,
    omit_script: 'true',
    theme: 'dark',
    chrome: 'noheader nofooter transparent',
    dnt: 'true',
  })

  const upstreamUrl = `https://publish.twitter.com/oembed?${upstreamParams.toString()}`

  try {
    const upstream = await fetch(upstreamUrl, {
      headers: { Accept: 'application/json' },
      next: { revalidate: ONE_HOUR_SECONDS },
    })

    if (!upstream.ok) {
      // 404 means handle doesn't exist or isn't embeddable — surface that
      // distinctly so the client can show the right error message.
      const status = upstream.status === 404 ? 404 : 502
      return NextResponse.json(
        { error: `Twitter oEmbed responded ${upstream.status}` },
        {
          status,
          headers: { 'Cache-Control': 'no-store' },
        }
      )
    }

    const data = (await upstream.json()) as OEmbedResponse
    if (!data.html) {
      return NextResponse.json({ error: 'oEmbed response missing html' }, { status: 502 })
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': `public, s-maxage=${ONE_HOUR_SECONDS}, stale-while-revalidate=${ONE_WEEK_SECONDS}`,
      },
    })
  } catch (err) {
    console.error('Twitter oEmbed proxy failed:', err)
    return NextResponse.json({ error: 'Upstream fetch failed' }, { status: 502 })
  }
}
