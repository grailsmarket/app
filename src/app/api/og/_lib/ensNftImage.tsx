import type { CSSProperties } from 'react'
import { labelhash, namehash } from 'viem'
import {
  DOMAIN_DEFAULT_IMAGE_URL_V2,
  DOMAIN_IMAGE_URL,
  DOMAIN_IMAGE_URL_V2,
  WRAPPED_DOMAIN_IMAGE_URL,
} from '@/constants/ens'

type EnsNftImageOptions = {
  name: string
  tokenId?: string | null
  width: number
  height: number
  style?: CSSProperties
}

// Call directly so Satori's initial image scan can preload every source concurrently.
export function renderEnsNftImage({ name, tokenId, width, height, style }: EnsNftImageOptions) {
  const sources = [
    `${DOMAIN_DEFAULT_IMAGE_URL_V2}/${name}/png`,
    `${DOMAIN_IMAGE_URL}/${labelhash(name.replace('.eth', ''))}/image/png`,
    `${WRAPPED_DOMAIN_IMAGE_URL}/${namehash(name)}/image/png`,
    ...(tokenId ? [`${DOMAIN_IMAGE_URL_V2}/${tokenId}/image/png`] : []),
  ]

  return (
    <div style={{ display: 'flex', position: 'relative', width, height, flexShrink: 0 }}>
      {sources.map((src, i) => (
        <img
          key={src}
          src={src}
          alt='ENS Image'
          width={width}
          height={height}
          style={{
            ...style,
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: i,
          }}
        />
      ))}
    </div>
  )
}
