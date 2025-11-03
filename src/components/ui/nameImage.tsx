import { DOMAIN_IMAGE_URL } from '@/constants'
import Image from 'next/image'
import React, { useState } from 'react'
import { numberToHex } from 'viem'
import { cn } from '@/utils/tailwind'

interface NameImageProps {
  name: string
  tokenId: string
  expiryDate: string | null
  className?: string
  height?: number
  width?: number
}

export default function NameImage({
  name,
  tokenId,
  expiryDate,
  className,
  height = 1024,
  width = 1024,
}: NameImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [displayFallback, setDisplayFallback] = useState(false)
  const imageSrc = `${DOMAIN_IMAGE_URL}/${numberToHex(BigInt(tokenId))}/image`
  const expireTime = expiryDate ? new Date(expiryDate).getTime() : ''
  const fallbackSrc = `/api/og/ens-name/${tokenId}?name=${encodeURIComponent(name)}&expires=${encodeURIComponent(expireTime)}`

  return (
    <Image
      unoptimized={!displayFallback}
      src={displayFallback ? fallbackSrc : imageSrc}
      alt={name}
      width={width}
      height={height}
      onError={() => setDisplayFallback(true)}
      onLoad={() => setIsLoading(false)}
      className={cn('bg-foreground/80 rounded-sm', isLoading ? 'animate-pulse' : '', className)}
    />
  )
}
