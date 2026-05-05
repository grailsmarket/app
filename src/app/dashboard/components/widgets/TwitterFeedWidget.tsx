'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { updateComponentConfig } from '@/state/reducers/dashboard'
import { selectTwitterFeedConfig } from '@/state/reducers/dashboard/selectors'

interface TwitterFeedWidgetProps {
  instanceId: string
}

// Minimal local typings for the Twitter widgets API. We only call
// `widgets.load(target)` to render anchors that already live in the DOM, and
// `ready(callback)` to wait for widgets.js to initialise.
// See https://docs.x.com/x-for-websites/javascript-api/guides/set-up-x-for-websites
interface TwttrWidgetsApi {
  load: (target?: HTMLElement) => Promise<void>
}

interface Twttr {
  widgets: TwttrWidgetsApi
  ready: (callback: (twttr: Twttr) => void) => void
  _e?: Array<(twttr: Twttr) => void>
}

declare global {
  interface Window {
    twttr?: Twttr
  }
}

const TWITTER_SCRIPT_SRC = 'https://platform.twitter.com/widgets.js'
const TWITTER_SCRIPT_ID = 'twitter-wjs'
// Twitter handles: 1–15 characters, alphanumeric + underscore only.
const HANDLE_REGEX = /^[A-Za-z0-9_]{1,15}$/

/**
 * Canonical "Set up X for Websites" loader, adapted from
 * https://docs.x.com/x-for-websites/javascript-api/guides/set-up-x-for-websites
 *
 * The official snippet sets up `window.twttr` synchronously with a queue
 * (`_e`) and a `ready()` method *before* widgets.js loads. When widgets.js
 * initialises, it drains the queue. This avoids the race that plagues
 * `script.onload`-based loaders: a callback added via `twttr.ready()` always
 * fires, whether the script is already loaded, mid-loading, or not yet
 * loaded.
 */
const ensureTwttr = (): Twttr | null => {
  if (typeof window === 'undefined') return null
  if (window.twttr) return window.twttr

  const stub: Twttr = {
    // `widgets.load` is provided by widgets.js once it boots. The stub here
    // exists only so the type is satisfied; nothing should call it before
    // widgets.js has populated the real implementation.
    widgets: {
      load: () => Promise.reject(new Error('twttr.widgets not yet ready')),
    },
    _e: [],
    ready(callback) {
      this._e?.push(callback)
    },
  }
  window.twttr = stub

  if (!document.getElementById(TWITTER_SCRIPT_ID)) {
    const firstScript = document.getElementsByTagName('script')[0]
    const script = document.createElement('script')
    script.id = TWITTER_SCRIPT_ID
    script.src = TWITTER_SCRIPT_SRC
    script.async = true
    if (firstScript?.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript)
    } else {
      document.head.appendChild(script)
    }
  }

  return stub
}

const onTwttrReady = (): Promise<Twttr> => {
  const stub = ensureTwttr()
  if (!stub) return Promise.reject(new Error('twttr unavailable on server'))
  // `ready` handles both cases: if widgets.js has already booted, the
  // callback fires immediately; otherwise it's queued on `_e` and drained
  // on script load.
  return new Promise((resolve) => stub.ready(resolve))
}

const parseHandle = (input: string): string | null => {
  const trimmed = input.trim()
  if (!trimmed) return null

  // Treat anything containing a slash as a URL attempt.
  if (trimmed.includes('/')) {
    try {
      const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`)
      const isXHost = ['x.com', 'twitter.com', 'mobile.x.com', 'mobile.twitter.com'].includes(
        url.hostname.toLowerCase()
      )
      if (!isXHost) return null
      const handle = url.pathname.split('/').filter(Boolean)[0]?.replace(/^@/, '')
      return handle && HANDLE_REGEX.test(handle) ? handle : null
    } catch {
      return null
    }
  }

  const stripped = trimmed.replace(/^@/, '')
  return HANDLE_REGEX.test(stripped) ? stripped : null
}

interface FailureState {
  reason: 'invalid-handle' | 'rate-limited' | 'network'
  message: string
}

const TwitterFeedWidget: React.FC<TwitterFeedWidgetProps> = ({ instanceId }) => {
  const dispatch = useAppDispatch()
  const config = useAppSelector((state) => selectTwitterFeedConfig(state, instanceId))
  const containerRef = useRef<HTMLDivElement>(null)
  const renderTokenRef = useRef(0)

  const [isEditing, setIsEditing] = useState(false)
  const [draftHandle, setDraftHandle] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [failure, setFailure] = useState<FailureState | null>(null)
  const [retryNonce, setRetryNonce] = useState(0)

  const handle = config?.handle ?? ''

  // Render flow:
  //   1. Fetch oEmbed HTML (a `.twitter-timeline` anchor) from our cached proxy.
  //   2. Inject it into the widget container.
  //   3. Ensure widgets.js is loaded.
  //   4. Call `widgets.load(container)` so widgets.js scans and replaces the
  //      anchor with the live timeline iframe.
  //
  // A render token guards against rapid handle changes — stale promises that
  // resolve after a newer render started are scrubbed.
  useEffect(() => {
    const container = containerRef.current
    if (!container || !handle) return

    const token = ++renderTokenRef.current
    setFailure(null)
    container.innerHTML = ''

    const controller = new AbortController()

    const run = async () => {
      const response = await fetch(`/api/twitter/oembed?handle=${encodeURIComponent(handle)}`, {
        signal: controller.signal,
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw Object.assign(new Error('Handle not found or not embeddable'), { code: 'invalid-handle' as const })
        }
        if (response.status === 429) {
          throw Object.assign(new Error('Twitter rate limit hit'), { code: 'rate-limited' as const })
        }
        throw Object.assign(new Error(`oEmbed proxy returned ${response.status}`), { code: 'network' as const })
      }

      const data = (await response.json()) as { html?: string }
      if (!data.html) {
        throw Object.assign(new Error('oEmbed proxy returned empty HTML'), { code: 'network' as const })
      }

      if (renderTokenRef.current !== token) return

      container.innerHTML = data.html
      const twttr = await onTwttrReady()
      if (renderTokenRef.current !== token) {
        container.innerHTML = ''
        return
      }
      await twttr.widgets.load(container)
      if (renderTokenRef.current !== token) container.innerHTML = ''
    }

    run().catch((err: unknown) => {
      if (renderTokenRef.current !== token) return
      if (err instanceof DOMException && err.name === 'AbortError') return

      const code = (err as { code?: FailureState['reason'] })?.code ?? 'network'
      const message =
        code === 'invalid-handle'
          ? `@${handle} couldn't be embedded — the account may be protected or suspended.`
          : code === 'rate-limited'
            ? "Twitter rate-limited the embed. It'll usually clear within a minute."
            : "Couldn't load the X timeline. Check your network or whether a privacy extension is blocking platform.twitter.com."

      console.warn('TwitterFeedWidget: failed to render timeline', err)
      setFailure({ reason: code, message })
    })

    return () => {
      controller.abort()
    }
  }, [handle, retryNonce])

  const commitHandle = useCallback(() => {
    const parsed = parseHandle(draftHandle)
    if (!parsed) {
      setError('Enter a valid X handle (e.g. ENSMarketBot)')
      return
    }
    setError(null)
    setIsEditing(false)
    if (parsed !== config?.handle) {
      dispatch(updateComponentConfig({ id: instanceId, patch: { handle: parsed } }))
    }
  }, [draftHandle, dispatch, instanceId, config?.handle])

  const startEditing = useCallback(() => {
    setDraftHandle(config?.handle ?? '')
    setError(null)
    setIsEditing(true)
  }, [config?.handle])

  const cancelEditing = useCallback(() => {
    setError(null)
    setIsEditing(false)
  }, [])

  const retry = useCallback(() => {
    setRetryNonce((n) => n + 1)
  }, [])

  if (!config) return null

  return (
    <div className='flex h-full flex-col'>
      <div className='border-tertiary flex shrink-0 flex-col gap-1 border-b px-3 py-2'>
        {isEditing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              commitHandle()
            }}
            className='flex items-center gap-2'
          >
            <span className='text-neutral text-sm font-medium'>@</span>
            <input
              autoFocus
              value={draftHandle}
              onChange={(e) => setDraftHandle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') cancelEditing()
              }}
              placeholder='ENSMarketBot'
              spellCheck={false}
              autoCapitalize='none'
              autoCorrect='off'
              className='border-tertiary focus:border-primary/60 h-8 min-w-0 flex-1 rounded-sm border bg-transparent px-2 text-sm transition-colors outline-none'
            />
            <button
              type='submit'
              className='bg-primary text-background hover:bg-primary/90 h-8 cursor-pointer rounded-sm px-3 text-xs font-semibold transition-colors'
            >
              Set
            </button>
            <button
              type='button'
              onClick={cancelEditing}
              className='text-neutral hover:bg-secondary h-8 cursor-pointer rounded-sm px-2 text-xs transition-colors'
            >
              Cancel
            </button>
          </form>
        ) : (
          <div className='flex items-center justify-between gap-2'>
            <button
              type='button'
              onClick={startEditing}
              className='hover:bg-secondary flex min-w-0 cursor-pointer items-center gap-1 rounded-sm px-1 py-1 text-left transition-colors'
            >
              <span className='truncate text-sm font-semibold'>@{handle}</span>
              <span className='text-neutral shrink-0 text-xs'>· Change</span>
            </button>
            <a
              href={`https://x.com/${handle}`}
              target='_blank'
              rel='noopener noreferrer'
              className='text-primary hover:text-primary/80 shrink-0 text-xs font-semibold'
            >
              Open on 𝕏
            </a>
          </div>
        )}
        {error && <span className='text-grace text-xs font-medium'>{error}</span>}
      </div>

      <div className='relative flex-1 overflow-hidden'>
        <div ref={containerRef} className='absolute inset-0 overflow-y-auto' />
        {failure && (
          <div className='bg-background absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center'>
            <span className='text-neutral text-sm'>{failure.message}</span>
            <button
              type='button'
              onClick={retry}
              className='text-primary hover:text-primary/80 cursor-pointer text-xs font-semibold'
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default TwitterFeedWidget
