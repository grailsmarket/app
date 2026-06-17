'use client'

import { fetchDomains } from '@/api/domains/fetchDomains'
import { emptyFilterState } from '@/state/reducers/filters/marketplaceFilters'
import { useQuery } from '@tanstack/react-query'
import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { motion, useMotionValue, animate, type AnimationPlaybackControls } from 'motion/react'
import Card from '../domains/grid/components/card'
import LoadingCard from '../domains/grid/components/loadingCard'
import { useUserContext } from '@/context/user'
import Image from 'next/image'
import ArrowIcon from 'public/icons/arrow-back.svg'
import AnimateIn from '../ui/animateIn'
import { useAppContainerWidth } from '@/hooks/useAppContainerWidth'

const CARD_WIDTH_MOBILE = 180
const CARD_HEIGHT_MOBILE = 360
const CARD_WIDTH_DESKTOP = 197
const CARD_HEIGHT_DESKTOP = 380
const CARD_GAP = 16
const AUTO_FLIP_MS = 3000
const MANUAL_PAUSE_MS = 10000

// Spring that settles the track after a swipe, flick, arrow tap or auto-flip.
// Tuned to feel natural — responsive but not stiff, with a gentle settle and no
// noticeable overshoot (damping ratio ≈ 0.95).
const SETTLE_SPRING = { type: 'spring', stiffness: 210, damping: 26, mass: 0.9 } as const
// How many seconds of "coasting" at the release velocity we project the throw
// forward by. Higher = a flick travels further. A 1000px/s flick projects ~200px
// (roughly one card); a hard 3000px/s flick projects ~600px (a few cards).
const VELOCITY_PROJECTION = 0.2
// Hard cap on how many cards a single swipe can travel, so a fast flick can never
// overshoot the clone buffer and reveal a seam in the infinite loop.
const MAX_CARDS_PER_SWIPE = 4
// Movement (px) a touch must clear before we lock it to an axis — lets vertical
// scrolls pass through to the page untouched.
const AXIS_LOCK_THRESHOLD = 8
// If the finger is held still longer than this before lifting, treat the release
// as having no velocity (so a pause-then-lift snaps rather than flicks).
const VELOCITY_IDLE_MS = 100

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const DisplayedCards: React.FC = () => {
  const { authStatus } = useUserContext()
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const width = useAppContainerWidth()
  const [isMounted, setIsMounted] = useState(false)
  const [isPositioned, setIsPositioned] = useState(false)
  const [isPausedByUser, setIsPausedByUser] = useState(false)
  const autoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // The track's horizontal offset in pixels — the single source of truth for
  // where the carousel sits. Gestures, the settle spring and auto-flip all write
  // to it; React never re-renders to move the track.
  const trackX = useMotionValue(0)
  // Logical index of the resting card within `trackItems`.
  const indexRef = useRef(0)
  // Handle to the in-flight settle animation so we can interrupt it.
  const settleRef = useRef<AnimationPlaybackControls | null>(null)

  // Live state of an in-progress touch drag.
  const dragRef = useRef({
    active: false,
    axis: 'undecided' as 'undecided' | 'horizontal' | 'vertical',
    startIndex: 0,
    startPointerX: 0,
    startPointerY: 0,
    startTrackX: 0,
    lastPointerX: 0,
    lastPointerTime: 0,
    velocity: 0, // px/s
  })

  const { data: domains, isLoading } = useQuery({
    queryKey: ['domains-carousel'],
    queryFn: async () => {
      const domains = await fetchDomains({
        limit: 25,
        pageParam: 1,
        filters: {
          ...emptyFilterState,
          market: {
            Listed: 'yes',
            'Has Offers': 'none',
            'Has Last Sale': 'none',
            marketplace: 'grails',
          },
          categories: ['any'],
        },
        searchTerm: '',
        excludeCategories: ['prepunks'],
        isAuthenticated: authStatus === 'authenticated',
        showUniqueSeller: true,
      })
      return domains.domains
    },
  })

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Measure container width
  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width)
      }
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const isMobile = containerWidth > 0 && containerWidth < 640
  const cardWidth = isMobile ? CARD_WIDTH_MOBILE : CARD_WIDTH_DESKTOP
  const cardHeight = isMobile ? CARD_HEIGHT_MOBILE : CARD_HEIGHT_DESKTOP
  const step = cardWidth + CARD_GAP

  const visibleCount = useMemo(() => {
    if (!containerWidth) return 5
    return Math.max(2, Math.floor((containerWidth + CARD_GAP) / step))
  }, [containerWidth, step])

  const totalCards = domains?.length ?? 0
  const cloneCount = Math.max(visibleCount + 6, 5)

  // Build track: [trailing clones] [real] [leading clones]
  const trackItems = useMemo(() => {
    if (!domains || domains.length === 0) return []
    const c = Math.min(cloneCount, domains.length)
    return [...domains.slice(-c), ...domains, ...domains.slice(0, c)]
  }, [domains, cloneCount])

  const hydratedWidth = isMounted ? width : null
  const smallMobileOffset = hydratedWidth && hydratedWidth < 440 ? (hydratedWidth - cardWidth) / 2 - step : 0

  // Pixel offset at which a given logical index sits at rest.
  const restX = useCallback((index: number) => -index * step + smallMobileOffset, [step, smallMobileOffset])

  // After a settle lands on a clone, snap instantly to the equivalent real card.
  // The clone is visually identical to the real card, so the jump is invisible
  // and the carousel keeps a full clone buffer on either side for the next swipe.
  const normalizeLoop = useCallback(() => {
    if (totalCards === 0) return
    const c = Math.min(cloneCount, totalCards)
    const i = indexRef.current
    const logical = (((i - c) % totalCards) + totalCards) % totalCards
    const normalized = c + logical
    if (normalized !== i) {
      indexRef.current = normalized
      trackX.jump(restX(normalized))
    }
  }, [totalCards, cloneCount, restX, trackX])

  // Animate the track to a target card with the settle spring, carrying any
  // release velocity into the spring so the motion continues from the flick.
  const settleTo = useCallback(
    (index: number, velocity = 0) => {
      indexRef.current = index
      settleRef.current?.stop()
      settleRef.current = animate(trackX, restX(index), {
        ...SETTLE_SPRING,
        velocity,
        onComplete: normalizeLoop,
      })
    },
    [trackX, restX, normalizeLoop]
  )

  // Initialize the track to the first real card once domains have loaded AND the
  // container has been measured, so the carousel is revealed in its final
  // position with the correct number of cards (no post-load reshuffle).
  const initializedRef = useRef(false)
  useEffect(() => {
    if (domains && domains.length > 0 && containerWidth > 0 && !initializedRef.current) {
      initializedRef.current = true
      const initial = Math.min(cloneCount, domains.length)
      indexRef.current = initial
      trackX.jump(restX(initial))
      setIsPositioned(true)
    }
  }, [domains, cloneCount, containerWidth, restX, trackX])

  // Keep the resting card aligned when the layout changes (resize, breakpoint or
  // the small-mobile centering offset). Re-position instantly, never animated.
  useEffect(() => {
    if (!initializedRef.current) return
    trackX.jump(restX(indexRef.current))
  }, [restX, trackX])

  const advance = useCallback(
    (direction: 1 | -1) => {
      if (totalCards === 0) return
      settleTo(indexRef.current + direction)
    },
    [totalCards, settleTo]
  )

  // Auto-flip timer
  useEffect(() => {
    if (isLoading || totalCards === 0 || isPausedByUser) return

    autoTimerRef.current = setInterval(() => {
      advance(1)
    }, AUTO_FLIP_MS)

    return () => {
      if (autoTimerRef.current) clearInterval(autoTimerRef.current)
    }
  }, [isLoading, totalCards, isPausedByUser, advance])

  // Pause auto-flip for a while after any manual interaction.
  const pauseAutoFlip = useCallback(() => {
    setIsPausedByUser(true)
    if (autoTimerRef.current) {
      clearInterval(autoTimerRef.current)
      autoTimerRef.current = null
    }
    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current)
    }
    pauseTimerRef.current = setTimeout(() => {
      setIsPausedByUser(false)
    }, MANUAL_PAUSE_MS)
  }, [])

  const handleManualNav = useCallback(
    (direction: 1 | -1) => {
      advance(direction)
      pauseAutoFlip()
    },
    [advance, pauseAutoFlip]
  )

  // Touch dragging. The track follows the finger 1:1 by writing straight to the
  // `trackX` motion value — no React re-render per move, so it stays smooth — and
  // we sample velocity ourselves. On release we project the throw from both the
  // dragged distance and the velocity, then settle to the resulting card.
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const touch = e.touches[0]
      settleRef.current?.stop()
      dragRef.current = {
        active: true,
        axis: 'undecided',
        startIndex: indexRef.current,
        startPointerX: touch.clientX,
        startPointerY: touch.clientY,
        startTrackX: trackX.get(),
        lastPointerX: touch.clientX,
        lastPointerTime: e.timeStamp,
        velocity: 0,
      }
    },
    [trackX]
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const drag = dragRef.current
      if (!drag.active) return
      const touch = e.touches[0]
      const dx = touch.clientX - drag.startPointerX
      const dy = touch.clientY - drag.startPointerY

      // Lock to an axis on the first decisive movement; if it's vertical, bow out
      // so the page scrolls normally and we never fight it.
      if (drag.axis === 'undecided') {
        if (Math.abs(dx) < AXIS_LOCK_THRESHOLD && Math.abs(dy) < AXIS_LOCK_THRESHOLD) return
        drag.axis = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical'
        if (drag.axis === 'horizontal') pauseAutoFlip()
      }
      if (drag.axis === 'vertical') return

      trackX.set(drag.startTrackX + dx)

      const dt = e.timeStamp - drag.lastPointerTime
      if (dt > 0) drag.velocity = ((touch.clientX - drag.lastPointerX) / dt) * 1000
      drag.lastPointerX = touch.clientX
      drag.lastPointerTime = e.timeStamp
    },
    [trackX, pauseAutoFlip]
  )

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const drag = dragRef.current
      if (!drag.active) return
      drag.active = false
      if (drag.axis !== 'horizontal') return

      // Drop stale velocity if the finger paused before lifting.
      const velocity = e.timeStamp - drag.lastPointerTime > VELOCITY_IDLE_MS ? 0 : drag.velocity

      // Project where the throw would coast to, then snap to the nearest card,
      // capping the reach so a hard flick never travels past the clone buffer.
      const projected = trackX.get() + velocity * VELOCITY_PROJECTION
      const nearestIndex = Math.round((smallMobileOffset - projected) / step)
      const reach = Math.min(MAX_CARDS_PER_SWIPE, Math.max(1, Math.min(cloneCount, totalCards)))
      const target = clamp(nearestIndex, drag.startIndex - reach, drag.startIndex + reach)

      settleTo(target, velocity)
      pauseAutoFlip()
    },
    [trackX, smallMobileOffset, step, cloneCount, totalCards, settleTo, pauseAutoFlip]
  )

  // Cleanup
  useEffect(() => {
    return () => {
      if (autoTimerRef.current) clearInterval(autoTimerRef.current)
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current)
      settleRef.current?.stop()
    }
  }, [])

  const hasDomains = !!domains && domains.length > 0
  const showEmpty = !isLoading && !hasDomains
  // Only reveal the carousel once everything that affects what's shown and
  // where it sits has settled: mount/hydration, container + window
  // measurement, the loaded domains, and the initial track position.
  const isReady = isMounted && !isLoading && containerWidth > 0 && (width ?? 0) > 0 && hasDomains && isPositioned

  // Adjusts the width to adapt to how many cards are visible, but not wider than the container width
  // which will help show more than 1 card on mobile
  const viewportWidth = Math.min(containerWidth, visibleCount * cardWidth + (visibleCount - 1) * CARD_GAP)

  return (
    <AnimateIn className='relative mt-6 w-full @[40rem]/app:px-8 @[80rem]/app:px-4'>
      <div ref={containerRef} className='w-full'>
        <div
          className='relative mx-auto'
          style={{ width: containerWidth && containerWidth > 440 ? viewportWidth : '100%' }}
        >
          {isReady && totalCards > visibleCount && (
            <>
              <button
                onClick={() => handleManualNav(-1)}
                className='bg-secondary/80 hover:bg-secondary border-tertiary absolute top-1/2 -left-1 z-30 flex h-10 w-10 -translate-y-2/3 cursor-pointer items-center justify-center rounded-full border-2 backdrop-blur-sm transition-colors @[40rem]/app:h-12 @[40rem]/app:w-12 @[48rem]/app:-left-6'
                aria-label='Previous card'
              >
                <Image src={ArrowIcon} alt='' width={16} height={14} className='rotate-180 invert dark:invert-0' />
              </button>
              <button
                onClick={() => handleManualNav(1)}
                className='bg-secondary/80 hover:bg-secondary border-tertiary absolute top-1/2 -right-1 z-30 flex h-10 w-10 -translate-y-2/3 cursor-pointer items-center justify-center rounded-full border-2 backdrop-blur-sm transition-colors @[40rem]/app:h-12 @[40rem]/app:w-12 @[48rem]/app:-right-6'
                aria-label='Next card'
              >
                <Image src={ArrowIcon} alt='' width={16} height={14} className='invert dark:invert-0' />
              </button>
            </>
          )}

          <div className='background-radial-primary absolute top-1/2 left-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 @[40rem]/app:h-[800px] @[40rem]/app:w-[800px]' />

          <div
            className='touch-pan-y overflow-hidden'
            style={{ height: cardHeight + 20 }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
          >
            <motion.div className='flex gap-4' style={{ x: trackX }}>
              {isReady
                ? trackItems.map((domain, index) => (
                    <div
                      key={`${domain.name}-${index}`}
                      className='shadow-homeCard shrink-0 rounded-xl'
                      style={{ width: cardWidth, height: cardHeight }}
                    >
                      <Card
                        domain={domain}
                        className='bg-secondary! hover:bg-tertiary! opacity-100! hover:opacity-100!'
                        isHomeCarousel={true}
                      />
                    </div>
                  ))
                : showEmpty
                  ? null
                  : Array.from({ length: hydratedWidth && hydratedWidth < 440 ? 3 : visibleCount }).map((_, index) => (
                      <div
                        key={index}
                        className='shadow-homeCard bg-secondary shrink-0 rounded-xl'
                        style={{ width: cardWidth, height: cardHeight }}
                      >
                        <LoadingCard />
                      </div>
                    ))}
            </motion.div>

            {showEmpty && <div className='flex h-full items-center justify-center'>No domains found</div>}
          </div>
        </div>
      </div>
    </AnimateIn>
  )
}

export default DisplayedCards
