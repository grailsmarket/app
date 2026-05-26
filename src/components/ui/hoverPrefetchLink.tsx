'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import Link, { LinkProps } from 'next/link'
import { useRouter } from 'next/navigation'

const DEFAULT_VIEWPORT_PREFETCH_DELAY = 250
const DEFAULT_VIEWPORT_PREFETCH_LIMIT = 12
const prefetchedHrefs = new Set<string>()
let viewportPrefetchCount = 0

type NavigatorWithConnection = Navigator & {
  connection?: {
    saveData?: boolean
    effectiveType?: string
  }
}

const shouldPrefetchInViewport = () => {
  if (typeof navigator === 'undefined') return false

  const connection = (navigator as NavigatorWithConnection).connection
  if (connection?.saveData) return false
  if (connection?.effectiveType && ['slow-2g', '2g'].includes(connection.effectiveType)) return false

  return true
}

// Next.js prefetches Links in the viewport on mount; toggling the
// `prefetch` prop after mount does not retroactively trigger a prefetch
// on the client. For links to name pages (`/[name]`) we want prefetch to
// be intent-based, so we render the underlying Link with prefetch disabled
// and call router.prefetch(href) ourselves on hover, press, or opted-in
// delayed viewport visibility.
type HoverPrefetchLinkProps = Omit<LinkProps, 'prefetch' | 'href'> &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    href: string
    children?: React.ReactNode
    viewportPrefetch?: boolean
    viewportPrefetchDelay?: number
    viewportPrefetchLimit?: number
  }

const HoverPrefetchLink = React.forwardRef<HTMLAnchorElement, HoverPrefetchLinkProps>(
  (
    {
      href,
      onMouseEnter,
      onPointerDown,
      children,
      viewportPrefetch = false,
      viewportPrefetchDelay = DEFAULT_VIEWPORT_PREFETCH_DELAY,
      viewportPrefetchLimit = DEFAULT_VIEWPORT_PREFETCH_LIMIT,
      ...rest
    },
    ref
  ) => {
    const router = useRouter()
    const localRef = useRef<HTMLAnchorElement | null>(null)
    const [isIntersecting, setIsIntersecting] = useState(false)

    const prefetchOnce = useCallback(() => {
      if (prefetchedHrefs.has(href)) return

      router.prefetch(href)
      prefetchedHrefs.add(href)
    }, [href, router])

    const setRefs = useCallback(
      (node: HTMLAnchorElement | null) => {
        localRef.current = node

        if (typeof ref === 'function') {
          ref(node)
        } else if (ref) {
          ref.current = node
        }
      },
      [ref]
    )

    const handleMouseEnter = useCallback(
      (event: React.MouseEvent<HTMLAnchorElement>) => {
        prefetchOnce()
        onMouseEnter?.(event)
      },
      [onMouseEnter, prefetchOnce]
    )

    const handlePointerDown = useCallback(
      (event: React.PointerEvent<HTMLAnchorElement>) => {
        prefetchOnce()
        onPointerDown?.(event)
      },
      [onPointerDown, prefetchOnce]
    )

    useEffect(() => {
      if (!viewportPrefetch || !localRef.current || !shouldPrefetchInViewport()) return

      const observer = new IntersectionObserver(
        ([entry]) => {
          setIsIntersecting(entry.isIntersecting)
        },
        { threshold: 0.5 }
      )
      observer.observe(localRef.current)

      return () => observer.disconnect()
    }, [viewportPrefetch])

    useEffect(() => {
      if (!viewportPrefetch || !isIntersecting || prefetchedHrefs.has(href)) return
      if (viewportPrefetchCount >= viewportPrefetchLimit) return

      let idleCallbackId: number | undefined
      const timeoutId = window.setTimeout(() => {
        if (viewportPrefetchCount >= viewportPrefetchLimit || prefetchedHrefs.has(href)) return

        const runPrefetch = () => {
          if (viewportPrefetchCount >= viewportPrefetchLimit || prefetchedHrefs.has(href)) return

          viewportPrefetchCount += 1
          prefetchOnce()
        }

        if ('requestIdleCallback' in window) {
          idleCallbackId = window.requestIdleCallback(runPrefetch, { timeout: 500 })
        } else {
          runPrefetch()
        }
      }, viewportPrefetchDelay)

      return () => {
        window.clearTimeout(timeoutId)
        if (idleCallbackId !== undefined && 'cancelIdleCallback' in window) {
          window.cancelIdleCallback(idleCallbackId)
        }
      }
    }, [href, isIntersecting, prefetchOnce, viewportPrefetch, viewportPrefetchDelay, viewportPrefetchLimit])

    return (
      <Link
        ref={setRefs}
        href={href}
        prefetch={false}
        onMouseEnter={handleMouseEnter}
        onPointerDown={handlePointerDown}
        {...rest}
      >
        {children}
      </Link>
    )
  }
)

HoverPrefetchLink.displayName = 'HoverPrefetchLink'

export default HoverPrefetchLink
