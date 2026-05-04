'use client'

import { APP_ENS_ADDRESS } from '@/constants'
import Image from 'next/image'
import React, { useEffect, useMemo, useRef, useState } from 'react'
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
    if (!pendingRefreshKey || !forceRefreshKey || pendingRefreshKey === refreshKey || forceRefreshKey === refreshKey) return
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

  // Subtract 400ms to ensure the state changes at the same time as the other components
  const status = forceRegStatus ?? getRegistrationStatus(expiryDate)

  // 0 = try wrapped SVG, 1 = try unwrapped SVG, 2 = give up on SVG and show PNG fallback.
  const [attempt, setAttempt] = useState(0)
  const [svg, setSvg] = useState<string | null>(null)
  const [pngLoaded, setPngLoaded] = useState(false)

  // Stack of in-flight SVG layers we render simultaneously to crossfade
  // between gradients (e.g. when registration status flips into Premium).
  // The newest layer mounts on top with opacity 0 and fades to 1 once it
  // loads; older layers stay visible underneath until the fade completes,
  // then are pruned and their blob URLs revoked.
  type SvgLayer = { url: string; loaded: boolean }
  const [layers, setLayers] = useState<SvgLayer[]>([])
  const layersRef = useRef<SvgLayer[]>([])
  useEffect(() => {
    layersRef.current = layers
  }, [layers])

  // When the caller bumps `refreshKey` (e.g. after a successful metadata
  // refresh), restart from the wrapped-SVG attempt so we re-run the full
  // fetch chain against the new cache-busted URL. We deliberately do NOT
  // clear `svg` or `layers` here — keeping the previously-loaded layer
  // mounted lets the new fetch's layer crossfade in over it instead of
  // flashing through gray. If the refetched SVG is byte-identical (the
  // metadata service often returns the same content), `setSvg` bails out
  // and the user sees no change, which is correct.
  useEffect(() => {
    if (refreshKey === undefined) return
    setAttempt(0)
    setPngLoaded(false)
    setSvg(null)
    setLayers([])
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
          setSvg(applyStateGradient(text, status))
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
  }, [attempt, wrappedSrc, unwrappedSrc, status, refreshKey])

  // Wrap the fetched SVG markup in a same-origin blob URL so we can render it
  // through an <img> element. That way the browser exposes the normal image
  // context-menu actions ("Copy Image", "Save Image As…") and writes a
  // rasterised bitmap to the system clipboard, which pastes into Twitter,
  // Slack, etc. Inlining via dangerouslySetInnerHTML hid those actions
  // because the SVG was just DOM, not an image.
  useEffect(() => {
    if (!svg) {
      setLayers((prev) => {
        prev.forEach((l) => URL.revokeObjectURL(l.url))
        return []
      })
      return
    }
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    setLayers((prev) => [...prev, { url, loaded: false }])
  }, [svg])

  // Once the topmost (newest) layer has rendered, wait for its opacity
  // transition to finish then drop everything underneath. The 500ms timer
  // matches the `duration-500` Tailwind class on the layer image.
  useEffect(() => {
    if (layers.length < 2) return
    const top = layers[layers.length - 1]
    if (!top.loaded) return
    const timer = setTimeout(() => {
      setLayers((prev) => {
        const t = prev[prev.length - 1]
        if (!t || !t.loaded) return prev
        prev.slice(0, -1).forEach((l) => URL.revokeObjectURL(l.url))
        return [t]
      })
    }, 400)
    return () => clearTimeout(timer)
  }, [layers])

  // Revoke any layers still around when the component unmounts.
  useEffect(
    () => () => {
      layersRef.current.forEach((l) => URL.revokeObjectURL(l.url))
    },
    []
  )

  const markLayerLoaded = (url: string) => {
    // Blob URLs resolve essentially instantly, so onLoad usually fires
    // before the browser has painted the layer's initial `opacity-0`
    // state. Toggling the class in the same frame collapses both states
    // into a single paint and the CSS transition never triggers. Two
    // requestAnimationFrame hops guarantee a paint of opacity:0 lands
    // before we flip to opacity:1, so the 500ms fade actually runs.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setLayers((prev) => prev.map((l) => (l.url === url ? { ...l, loaded: true } : l)))
      })
    })
  }

  const sizeStyle = width !== undefined || height !== undefined ? { width, height } : undefined

  const showPngFallback = attempt >= 2
  const hasLoadedLayer = layers.some((l) => l.loaded)
  const loaded = showPngFallback ? pngLoaded : hasLoadedLayer

  const wrapperClasses = cn(
    'bg-foreground/80 rounded-sm overflow-hidden relative',
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

  return (
    <div aria-label={name} id={`name-image-${name}-${refreshKey}`} role='img' style={sizeStyle} className={wrapperClasses}>
      <svg
        aria-hidden
        viewBox={`0 0 ${INTRINSIC_SIZE} ${INTRINSIC_SIZE}`}
        width={INTRINSIC_SIZE}
        height={INTRINSIC_SIZE}
        className='invisible block h-full w-full'
      />
      {!hasLoadedLayer && (
        <div className='absolute inset-0 z-10'>
          <LoadingCell height='100%' width='100%' />
        </div>
      )}
      {layers.map((layer, i) => {
        const isTop = i === layers.length - 1
        return (
          <img
            key={layer.url}
            src={layer.url}
            alt={isTop ? name : ''}
            aria-hidden={!isTop}
            onLoad={() => markLayerLoaded(layer.url)}
            className={cn(
              'absolute top-0 left-0 block h-full w-full object-cover',
              isTop && 'transition-opacity duration-[400ms]',
              isTop && !layer.loaded && 'opacity-0'
            )}
          />
        )
      })}
    </div>
  )
}
export default NameImage
