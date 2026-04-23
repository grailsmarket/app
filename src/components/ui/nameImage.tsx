'use client'

import { APP_ENS_ADDRESS } from '@/constants'
import Image from 'next/image'
import React, { useEffect, useMemo, useState } from 'react'
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

export default function NameImage({ name, expiryDate, className, height = 1024, width = 1024 }: NameImageProps) {
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
        setSvg(responsiveSvg(applyStateGradient(text, status)))
      })
      .catch(() => {
        if (!cancelled) setAttempt((a) => a + 1)
      })

    return () => {
      cancelled = true
    }
  }, [attempt, wrappedSrc, unwrappedSrc, status])

  if (attempt >= 2) {
    return (
      <Image
        src={fallbackSrc}
        alt={name}
        width={width}
        height={height}
        className={cn('bg-foreground/80 rounded-sm', className)}
      />
    )
  }

  if (!svg) {
    return (
      <div
        aria-label={name}
        role="img"
        className={cn('bg-foreground/80 rounded-sm animate-pulse', className)}
        style={{ width, height, aspectRatio: '1 / 1' }}
      />
    )
  }

  return (
    <div
      aria-label={name}
      role="img"
      className={cn('bg-foreground/80 rounded-sm overflow-hidden', className)}
      style={{ width, height, aspectRatio: '1 / 1' }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
