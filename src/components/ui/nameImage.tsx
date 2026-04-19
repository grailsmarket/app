import { APP_ENS_ADDRESS } from '@/constants'
import Image from 'next/image'
import React, { useState } from 'react'
import { hexToBigInt, labelhash, namehash } from 'viem'
import { cn } from '@/utils/tailwind'
import { ENS_NAME_WRAPPER_ADDRESS } from '@/constants/web3/contracts'

export const WRAPPED_DOMAIN_IMAGE_URL = `https://ens-metadata-flarecloud.encrypted-063.workers.dev/mainnet/${ENS_NAME_WRAPPER_ADDRESS}`
export const UNWRAPPED_DOMAIN_IMAGE_URL = `https://ens-metadata-flarecloud.encrypted-063.workers.dev/mainnet/${APP_ENS_ADDRESS}`

interface NameImageProps {
  name: string
  tokenId: string
  expiryDate: string | null
  className?: string
  height?: number
  width?: number
}

export default function NameImage({ name, expiryDate, className, height = 1024, width = 1024 }: NameImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [displayFallback, setDisplayFallback] = useState(false)

  // Namehash is used for wrapped names
  const nameHash = namehash(name)

  // Labelhash is used for unwrapped names
  const labelHash = labelhash(name.replace('.eth', ''))

  const wrappedSrc = `${WRAPPED_DOMAIN_IMAGE_URL}/${hexToBigInt(nameHash).toString()}/image`
  const unwrappedSrc = `${UNWRAPPED_DOMAIN_IMAGE_URL}/${hexToBigInt(labelHash).toString()}/image`

  const [imageSrc, setImageSrc] = useState(wrappedSrc)
  const expireTime = expiryDate ? new Date(expiryDate).getTime() : ''
  const fallbackSrc = `/api/og/ens-name/${hexToBigInt(nameHash).toString()}?name=${encodeURIComponent(name)}&expires=${encodeURIComponent(expireTime)}`

  return (
    <Image
      unoptimized={!displayFallback}
      src={displayFallback ? fallbackSrc : imageSrc}
      alt={name}
      width={width}
      height={height}
      onError={() => {
        if (imageSrc === wrappedSrc) {
          setImageSrc(unwrappedSrc)
        } else {
          setDisplayFallback(true)
        }
      }}
      onLoad={() => setIsLoading(false)}
      className={cn('bg-foreground/80 rounded-sm', isLoading ? 'animate-pulse' : '', className)}
    />
  )
}
