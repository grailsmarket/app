import React from 'react'
import Link from 'next/link'
import { isAddress } from 'viem'
import { cn } from '@/utils/tailwind'

// URL must come first so links like `https://vitalik.eth/foo` are captured
// whole rather than splitting into a URL fragment and a separate ENS match.
// `@<ens>` precedes bare `<ens>` so that mentions take priority over plain names.
const PATTERN =
  /(https?:\/\/[^\s<>"']+[^\s<>"'.,;:!?)\]])|(@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.eth)|([a-z0-9-]+(?:\.[a-z0-9-]+)*\.eth)|(0x[a-f0-9]{40})/gi

interface Options {
  linkClassName?: string
  onClick: () => void
}

const LINK_BASE_CLASSES = 'underline underline-offset-2 font-semibold transition-opacity hover:opacity-70'

export const linkifyMessage = (text: string, options: Options = { onClick: () => {} }): React.ReactNode => {
  if (!text) return text

  const linkClass = cn(LINK_BASE_CLASSES, options.linkClassName)
  const nodes: React.ReactNode[] = []
  let cursor = 0
  let key = 0

  for (const match of text.matchAll(PATTERN)) {
    const [matched, url, mention, ens, address] = match
    const start = match.index ?? 0

    if (start > cursor) {
      nodes.push(text.slice(cursor, start))
    }

    if (url) {
      nodes.push(
        <a
          key={`u-${key++}`}
          href={url}
          target='_blank'
          rel='noopener noreferrer'
          className={linkClass}
          onClick={(e) => e.stopPropagation()}
        >
          {url}
        </a>
      )
    } else if (mention) {
      const name = mention.slice(1)
      nodes.push(
        <Link
          key={`m-${key++}`}
          href={`/profile/${name}`}
          className={linkClass}
          onClick={(e) => {
            e.stopPropagation()
            options.onClick()
          }}
        >
          {mention}
        </Link>
      )
    } else if (ens) {
      nodes.push(
        <Link
          key={`e-${key++}`}
          href={`/${ens}`}
          className={linkClass}
          onClick={(e) => {
            e.stopPropagation()
            options.onClick()
          }}
        >
          {ens}
        </Link>
      )
    } else if (address && isAddress(address)) {
      nodes.push(
        <Link
          key={`a-${key++}`}
          href={`/profile/${address}`}
          className={linkClass}
          onClick={(e) => {
            e.stopPropagation()
            options.onClick()
          }}
        >
          {address}
        </Link>
      )
    } else {
      nodes.push(matched)
    }

    cursor = start + matched.length
  }

  if (cursor < text.length) {
    nodes.push(text.slice(cursor))
  }

  return nodes
}
