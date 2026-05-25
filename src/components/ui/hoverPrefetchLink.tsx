'use client'

import React, { useCallback, useRef } from 'react'
import Link, { LinkProps } from 'next/link'
import { useRouter } from 'next/navigation'

// Next.js prefetches Links in the viewport on mount; toggling the
// `prefetch` prop after mount does not retroactively trigger a prefetch
// on the client. For links to name pages (`/[name]`) we want prefetch to
// fire only on hover, so we render the underlying Link with prefetch
// disabled and call router.prefetch(href) ourselves on mouse enter.
type HoverPrefetchLinkProps = Omit<LinkProps, 'prefetch' | 'href'> &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    href: string
    children?: React.ReactNode
  }

const HoverPrefetchLink = React.forwardRef<HTMLAnchorElement, HoverPrefetchLinkProps>(
  ({ href, onMouseEnter, children, ...rest }, ref) => {
    const router = useRouter()
    const hasPrefetched = useRef(false)

    const handleMouseEnter = useCallback(
      (event: React.MouseEvent<HTMLAnchorElement>) => {
        if (!hasPrefetched.current) {
          router.prefetch(href)
          hasPrefetched.current = true
        }
        onMouseEnter?.(event)
      },
      [href, onMouseEnter, router]
    )

    return (
      <Link ref={ref} href={href} prefetch={false} onMouseEnter={handleMouseEnter} {...rest}>
        {children}
      </Link>
    )
  }
)

HoverPrefetchLink.displayName = 'HoverPrefetchLink'

export default HoverPrefetchLink
