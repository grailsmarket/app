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

export const WRAPPED_DOMAIN_IMAGE_URL = `${ENS_METADATA_URL}/mainnet/${ENS_NAME_WRAPPER_ADDRESS}`
export const UNWRAPPED_DOMAIN_IMAGE_URL = `${ENS_METADATA_URL}/mainnet/${APP_ENS_ADDRESS}`

interface NameImageProps {
  name: string
  tokenId: string
  expiryDate: string | null
  className?: string
  height?: number
  width?: number
}

// Make the bundled 270×270 SVG scale to whatever container we drop it into
// while preserving aspect ratio.
function responsiveSvg(svg: string): string {
  return svg.replace(/<svg\s+width="270"\s+height="270"/, '<svg width="100%" height="100%"')
}

// Inline SVG <defs> ids live in the same document-wide namespace as every
// other element. When we render dozens of cards at once, all `url(#paint0_linear)`
// / `url(#dropShadow)` references collide and browsers resolve them to
// whichever definition parsed first — which often belongs to a different
// card (or is missing entirely when the first card renders an avatar and
// thus has no paint0). Result: gradients and drop-shadows vanish on every
// card after the first. Suffixing every id + reference per instance fixes
// it.
const SCOPED_IDS = ['paint0_linear', 'paint1_linear', 'dropShadow']
function scopeSvgIds(svg: string, suffix: string): string {
  let out = svg
  for (const id of SCOPED_IDS) {
    out = out.split(`id="${id}"`).join(`id="${id}_${suffix}"`)
    out = out.split(`url(#${id})`).join(`url(#${id}_${suffix})`)
  }
  return out
}

export default function NameImage({ name, expiryDate, className, height, width }: NameImageProps) {
  const nameHash = namehash(name)
  const labelHash = labelhash(name.replace('.eth', ''))

  const wrappedSrc = useMemo(
    () => `${WRAPPED_DOMAIN_IMAGE_URL}/${hexToBigInt(nameHash).toString()}/image`,
    [nameHash],
  )
  const unwrappedSrc = useMemo(
    () => `${UNWRAPPED_DOMAIN_IMAGE_URL}/${hexToBigInt(labelHash).toString()}/image`,
    [labelHash],
  )
  const expireTime = expiryDate ? new Date(expiryDate).getTime() : ''
  const fallbackSrc = `/api/og/ens-name/${hexToBigInt(nameHash).toString()}?name=${encodeURIComponent(
    name,
  )}&expires=${encodeURIComponent(expireTime)}`

  const status = getRegistrationStatus(expiryDate)

  // React's `useId` produces something like `:r5:` — the colons aren't
  // valid in SVG `id` attribute values, so strip them.
  const idSuffix = useId().replace(/:/g, '')

  // 0 = try wrapped SVG, 1 = try unwrapped SVG, 2 = give up on SVG and show PNG fallback.
  const [attempt, setAttempt] = useState(0)
  const [svg, setSvg] = useState<string | null>(null)

  useEffect(() => {
    if (attempt >= 2) return
    const url = attempt === 0 ? wrappedSrc : unwrappedSrc

    let cancelled = false
    fetch(url)
      .then((r) => (r.ok ? r.text() : Promise.reject(r.status)))
      .then((text) => {
        if (cancelled) return
        setSvg(scopeSvgIds(responsiveSvg(applyStateGradient(text, status)), idSuffix))
      })
      .catch(() => {
        if (!cancelled) setAttempt((a) => a + 1)
      })

    return () => {
      cancelled = true
    }
  }, [attempt, wrappedSrc, unwrappedSrc, status, idSuffix])

  // Callers size the image via `className` (Tailwind w-*/h-*). The
  // width/height props are a fallback for callers that don't set sizing
  // classes — we only apply them inline when provided so className wins
  // when both are present.
  const sizeStyle = width !== undefined || height !== undefined ? { width, height } : undefined

  if (attempt >= 2) {
    return (
      <Image
        src={fallbackSrc}
        alt={name}
        width={width ?? 1024}
        height={height ?? 1024}
        className={cn('bg-foreground/80 rounded-sm', className)}
      />
    )
  }

  // `[&>svg]:*` makes the injected SVG fill the wrapper in both dimensions
  // so the rendered image tracks the wrapper's computed size exactly —
  // which is what the Tailwind sizing classes on `className` control.
  const wrapperClasses = cn(
    'bg-foreground/80 rounded-sm overflow-hidden [&>svg]:block [&>svg]:h-full [&>svg]:w-full',
    !svg && 'animate-pulse',
    className,
  )

  if (!svg) {
    return <div aria-label={name} role='img' style={sizeStyle} className={wrapperClasses} />
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
