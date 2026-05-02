'use client'

import { APP_ENS_ADDRESS } from '@/constants'
import Image from 'next/image'
import React, { useEffect, useId, useMemo, useState } from 'react'
import { hexToBigInt, labelhash, namehash } from 'viem'
import { cn } from '@/utils/tailwind'
import { ENS_NAME_WRAPPER_ADDRESS } from '@/constants/web3/contracts'
import { ENS_METADATA_URL } from '@/constants/ens'
import { getRegistrationStatus } from '@/utils/getRegistrationStatus'
import { applyStateGradient } from '@/utils/ensImage/applyStateGradient'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { consumeImageRefresh, selectImageRefreshKey } from '@/state/reducers/imageRefresh'
import LoadingCell from './loadingCell'
import { RegistrationStatus } from '@/types/domains'

export const WRAPPED_DOMAIN_IMAGE_URL = `${ENS_METADATA_URL}/mainnet/${ENS_NAME_WRAPPER_ADDRESS}`
export const UNWRAPPED_DOMAIN_IMAGE_URL = `${ENS_METADATA_URL}/mainnet/${APP_ENS_ADDRESS}`

const INTRINSIC_SIZE = 270

interface NameImageProps {
  name: string
  tokenId: string
  expiryDate: string | null
  className?: string
  height?: number
  width?: number
  forceRegStatus?: RegistrationStatus
  forceRefreshKey?: number
}

function responsiveSvg(svg: string): string {
  return svg.replace(/<svg\b([^>]*)>/, (_match, attrs: string) => {
    const cleaned = attrs.replace(/\s*preserveAspectRatio="[^"]*"/g, '')
    return `<svg${cleaned} preserveAspectRatio="xMidYMid slice">`
  })
}

const SCOPED_IDS = ['paint0_linear', 'paint1_linear', 'dropShadow']
function scopeSvgIds(svg: string, suffix: string): string {
  let out = svg
  for (const id of SCOPED_IDS) {
    out = out.split(`id="${id}"`).join(`id="${id}_${suffix}"`)
    out = out.split(`url(#${id})`).join(`url(#${id}_${suffix})`)
  }
  return out
}

const NameImage = ({ name, expiryDate, className, height, width, forceRegStatus, forceRefreshKey }: NameImageProps) => {
  const nameHash = namehash(name)
  const labelHash = labelhash(name.replace('.eth', ''))

  // Pending hard-refresh signal published to Redux by callers like the
  // metadata refresh button or the records-edit modal. We capture the
  // timestamp into local state on first sight and immediately consume it
  // from Redux so other instances of this name (or a future remount) don't
  // refresh again — the local copy keeps the cache-busted URL stable.
  const dispatch = useAppDispatch()
  const pendingRefreshKey = useAppSelector(selectImageRefreshKey(name))
  const [refreshKey, setRefreshKey] = useState<number | undefined>(undefined)

  useEffect(() => {
    if (pendingRefreshKey === undefined || pendingRefreshKey === refreshKey || forceRefreshKey) return
    setRefreshKey(forceRefreshKey ?? pendingRefreshKey)
    dispatch(consumeImageRefresh(name))
  }, [pendingRefreshKey, refreshKey, dispatch, name, forceRefreshKey])

  const cacheParam = useMemo(() => (refreshKey ? `?v=${refreshKey}` : ''), [refreshKey])
  const wrappedSrc = useMemo(
    () => `${WRAPPED_DOMAIN_IMAGE_URL}/${hexToBigInt(nameHash).toString()}/image${cacheParam}`,
    [nameHash, cacheParam]
  )
  const unwrappedSrc = useMemo(
    () => `${UNWRAPPED_DOMAIN_IMAGE_URL}/${hexToBigInt(labelHash).toString()}/image${cacheParam}`,
    [labelHash, cacheParam]
  )

  const expireTime = expiryDate ? new Date(expiryDate).getTime() : ''
  const fallbackSrc = `/api/og/ens-name/${hexToBigInt(nameHash).toString()}?name=${encodeURIComponent(
    name
  )}&expires=${encodeURIComponent(expireTime)}${refreshKey ? `&v=${refreshKey}` : ''}`

  const status = forceRegStatus ?? getRegistrationStatus(expiryDate)

  // React's `useId` produces something like `:r5:` — the colons aren't
  // valid in SVG `id` attribute values, so strip them.
  const idSuffix = useId().replace(/:/g, '')

  // 0 = try wrapped SVG, 1 = try unwrapped SVG, 2 = give up on SVG and show PNG fallback.
  const [attempt, setAttempt] = useState(0)
  const [svg, setSvg] = useState<string | null>(null)
  const [pngLoaded, setPngLoaded] = useState(false)

  // When the caller bumps `refreshKey` (e.g. after a successful metadata
  // refresh), restart from the wrapped-SVG attempt so we re-run the full
  // fetch chain against the new cache-busted URL.
  useEffect(() => {
    if (refreshKey === undefined) return
    setAttempt(0)
    setSvg(null)
    setPngLoaded(false)
  }, [refreshKey])

  useEffect(() => {
    if (attempt >= 2) return
    const url = attempt === 0 ? wrappedSrc : unwrappedSrc

    let cancelled = false
    const maxRetries = 3

    // `/explore` fires dozens of parallel fetches; a share of them transiently
    // fail under worker / HTTP-2 stream pressure, so retry with backoff before
    // falling through. A genuine 404 means this name isn't at this contract —
    // skip ahead to the next URL immediately.
    const attemptFetch = async (retry = 0): Promise<void> => {
      try {
        // `cache: 'reload'` when a refreshKey is active forces the browser to
        // bypass its HTTP cache for this fetch — the `?v=` query already
        // makes the URL unique, but `reload` covers any intermediate caches
        // that ignore query params.
        const res = await fetch(url, refreshKey !== undefined ? { cache: 'reload' } : undefined)
        if (res.status === 404) {
          if (!cancelled) setAttempt((a) => a + 1)
          return
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const text = await res.text()
        if (!cancelled) {
          setSvg(scopeSvgIds(responsiveSvg(applyStateGradient(text, status)), idSuffix))
        }
      } catch {
        if (cancelled) return
        if (retry < maxRetries) {
          const backoff = 250 * 2 ** retry + Math.random() * 150
          setTimeout(() => {
            if (!cancelled) attemptFetch(retry + 1)
          }, backoff)
          return
        }
        if (!cancelled) setAttempt((a) => a + 1)
      }
    }

    attemptFetch()

    return () => {
      cancelled = true
    }
  }, [attempt, wrappedSrc, unwrappedSrc, status, idSuffix, refreshKey])

  const sizeStyle = width !== undefined || height !== undefined ? { width, height } : undefined

  const showPngFallback = attempt >= 2
  const loaded = showPngFallback ? pngLoaded : !!svg

  const wrapperClasses = cn(
    'bg-foreground/80 rounded-sm overflow-hidden relative',
    // `pointer-events-none` on the injected SVG lets clicks pass through to
    // the wrapping element (e.g. the domain card's <Link>). The ENS metadata
    // service embeds an <a> inside its SVGs, and without this those inner
    // anchors swallow the click and navigate away from our intended href.
    '[&>svg]:pointer-events-none [&>svg]:block [&>svg]:-m-px [&>svg]:h-[calc(100%+2px)] [&>svg]:w-[calc(100%+2px)]',
    // The metadata service renders its name text in a heavier custom font;
    // once we inline the SVG it inherits our body font (Inter), which
    // renders visually lighter at the same nominal weight. Extrabold on
    // <text> inside the SVG gets Inter's visual weight close to the
    // service's direct output.
    '[&>svg_text]:font-extrabold',
    !loaded && 'animate-pulse',
    className
  )

  if (showPngFallback) {
    return (
      <div aria-label={name} role='img' style={sizeStyle} className={wrapperClasses}>
        {!pngLoaded && (
          <div className='absolute inset-0 z-10'>
            <LoadingCell height='100%' width='100%' />
          </div>
        )}
        <Image
          src={fallbackSrc}
          alt={name}
          width={width ?? INTRINSIC_SIZE}
          height={height ?? INTRINSIC_SIZE}
          onLoad={() => setPngLoaded(true)}
          className={cn(
            '-m-px block h-[calc(100%+2px)] w-[calc(100%+2px)] object-cover transition-opacity duration-200',
            !pngLoaded && 'opacity-0'
          )}
        />
      </div>
    )
  }

  if (!svg) {
    return (
      <div aria-label={name} role='img' style={sizeStyle} className={wrapperClasses}>
        <svg
          aria-hidden
          viewBox={`0 0 ${INTRINSIC_SIZE} ${INTRINSIC_SIZE}`}
          width={INTRINSIC_SIZE}
          height={INTRINSIC_SIZE}
          className='invisible block h-full w-full'
        />
        <div className='absolute inset-0'>
          <LoadingCell height='100%' width='100%' />
        </div>
      </div>
    )
  }

  return (
    <div
      aria-label={name}
      role='img'
      style={sizeStyle}
      className={wrapperClasses}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
export default NameImage
