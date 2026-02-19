'use client'

import { fetchDomains } from '@/api/domains/fetchDomains'
import { emptyFilterState } from '@/state/reducers/filters/marketplaceFilters'
import { useQuery } from '@tanstack/react-query'
import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import Card from '../domains/grid/components/card'
import LoadingCard from '../domains/grid/components/loadingCard'
import { useUserContext } from '@/context/user'
import Image from 'next/image'
import ArrowIcon from 'public/icons/arrow-back.svg'
import AnimateIn from '../ui/animateIn'
import { useWindowSize } from 'ethereum-identity-kit'

const CARD_WIDTH_MOBILE = 180
const CARD_HEIGHT_MOBILE = 360
const CARD_WIDTH_DESKTOP = 197
const CARD_HEIGHT_DESKTOP = 380
const CARD_GAP = 16
const AUTO_FLIP_MS = 3000
const MANUAL_PAUSE_MS = 10000
const TRANSITION_MS = 500
const SWIPE_THRESHOLD = 0.2 // fraction of card width needed to trigger a swipe

const DisplayedCards: React.FC = () => {
  const { authStatus } = useUserContext()
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const { width } = useWindowSize()
  const [trackPos, setTrackPos] = useState(0)
  const [enableTransition, setEnableTransition] = useState(true)
  const [isPausedByUser, setIsPausedByUser] = useState(false)
  const autoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMobileRef = useRef(false)
  const touchStartXRef = useRef(0)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const isSwipingRef = useRef(false)

  const { data: domains, isLoading } = useQuery({
    queryKey: ['domains-carousel'],
    queryFn: async () => {
      const domains = await fetchDomains({
        limit: 50,
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
  isMobileRef.current = isMobile
  const cardWidth = isMobile ? CARD_WIDTH_MOBILE : CARD_WIDTH_DESKTOP
  const cardHeight = isMobile ? CARD_HEIGHT_MOBILE : CARD_HEIGHT_DESKTOP
  const step = cardWidth + CARD_GAP

  const visibleCount = useMemo(() => {
    if (!containerWidth) return 5
    return Math.max(2, Math.floor((containerWidth + CARD_GAP) / step))
  }, [containerWidth, step])

  const totalCards = domains?.length ?? 0
  const cloneCount = Math.max(visibleCount + 2, 5)

  // Build track: [trailing clones] [real] [leading clones]
  const trackItems = useMemo(() => {
    if (!domains || domains.length === 0) return []
    const c = Math.min(cloneCount, domains.length)
    return [...domains.slice(-c), ...domains, ...domains.slice(0, c)]
  }, [domains, cloneCount])

  // Initialize trackPos to cloneCount (first real card) once domains load
  const initializedRef = useRef(false)
  useEffect(() => {
    if (domains && domains.length > 0 && !initializedRef.current) {
      initializedRef.current = true
      setEnableTransition(false)
      setTrackPos(Math.min(cloneCount, domains.length))
    }
  }, [domains, cloneCount])

  // Re-enable transition after initialization snap
  useEffect(() => {
    if (!enableTransition) {
      const frame = requestAnimationFrame(() => {
        setEnableTransition(true)
      })
      return () => cancelAnimationFrame(frame)
    }
  }, [enableTransition])

  const advance = useCallback(
    (direction: 1 | -1) => {
      if (totalCards === 0) return
      setTrackPos((prev) => prev + direction)
    },
    [totalCards]
  )

  // Handle seamless loop on transition end
  const handleTransitionEnd = useCallback(() => {
    if (totalCards === 0) return
    const c = Math.min(cloneCount, totalCards)
    setTrackPos((prev) => {
      // Past last real card → snap to first real
      if (prev >= c + totalCards) {
        setEnableTransition(false)
        return c
      }
      // Before first real card → snap to last real
      if (prev < c) {
        setEnableTransition(false)
        return c + totalCards - 1
      }
      return prev
    })
  }, [totalCards, cloneCount])

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

  const handleManualNav = useCallback(
    (direction: 1 | -1) => {
      advance(direction)

      // Pause auto-flip
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
    },
    [advance]
  )

  // Touch swipe handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX
    isSwipingRef.current = true
    setSwipeOffset(0)
    setEnableTransition(false)
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!isSwipingRef.current) return
    const diff = e.touches[0].clientX - touchStartXRef.current
    // e.currentTarget.style.transform = `translateX(${-trackPos * step + diff}px)`
    setSwipeOffset(diff)
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (!isSwipingRef.current) return
    isSwipingRef.current = false
    setEnableTransition(true)

    const threshold = cardWidth * SWIPE_THRESHOLD
    if (swipeOffset < -threshold) {
      handleManualNav(1)
    } else if (swipeOffset > threshold) {
      handleManualNav(-1)
    }

    setSwipeOffset(0)
  }, [swipeOffset, cardWidth, handleManualNav])

  // Cleanup
  useEffect(() => {
    return () => {
      if (autoTimerRef.current) clearInterval(autoTimerRef.current)
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current)
    }
  }, [])

  const smallMobileOffset = width && width < 440 ? ((width - cardWidth) / 2) - step : 0
  const translateX = -trackPos * step + swipeOffset + smallMobileOffset

  // Adjusts the width to adapt to how many cards are visible, but not wider than the container width
  // which will help show more than 1 card on mobile
  const viewportWidth = Math.min(containerWidth, visibleCount * cardWidth + (visibleCount - 1) * CARD_GAP)

  return (
    <AnimateIn className='relative mt-6 w-full sm:px-8 xl:px-4'>
      <div ref={containerRef} className='w-full'>
        <div
          className='relative mx-auto'
          style={{ width: containerWidth && containerWidth > 440 ? viewportWidth : '100%' }}
        >
          {!isLoading && totalCards > visibleCount && (
            <>
              <button
                onClick={() => handleManualNav(-1)}
                className='bg-secondary/80 hover:bg-secondary border-tertiary absolute top-1/2 -left-1 z-30 flex h-10 w-10 -translate-y-2/3 cursor-pointer items-center justify-center rounded-full border-2 backdrop-blur-sm transition-colors sm:h-12 sm:w-12 md:-left-6'
                aria-label='Previous card'
              >
                <Image src={ArrowIcon} alt='' width={16} height={14} className='rotate-180 invert dark:invert-0' />
              </button>
              <button
                onClick={() => handleManualNav(1)}
                className='bg-secondary/80 hover:bg-secondary border-tertiary absolute top-1/2 -right-1 z-30 flex h-10 w-10 -translate-y-2/3 cursor-pointer items-center justify-center rounded-full border-2 backdrop-blur-sm transition-colors sm:h-12 sm:w-12 md:-right-6'
                aria-label='Next card'
              >
                <Image src={ArrowIcon} alt='' width={16} height={14} className='invert dark:invert-0' />
              </button>
            </>
          )}

          <div className='background-radial-primary absolute top-1/2 left-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 sm:h-[800px] sm:w-[800px]' />

          <div
            className='touch-pan-y overflow-hidden'
            style={{ height: cardHeight + 20 }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className='flex gap-4'
              style={{
                transform: `translateX(${translateX}px)`,
                transition: enableTransition ? `transform ${TRANSITION_MS}ms ease` : 'none',
              }}
              onTransitionEnd={handleTransitionEnd}
            >
              {isLoading
                ? Array.from({ length: width && width < 440 ? 3 : visibleCount }).map((_, index) => (
                  <div
                    key={index}
                    className='shadow-homeCard bg-secondary shrink-0 rounded-xl'
                    style={{ width: cardWidth, height: cardHeight }}
                  >
                    <LoadingCard />
                  </div>
                ))
                : trackItems.map((domain, index) => (
                  <div
                    key={`${domain.name}-${index}`}
                    className='shadow-homeCard shrink-0 rounded-xl'
                    style={{ width: cardWidth, height: cardHeight }}
                  >
                    <Card
                      domain={domain}
                      className='bg-secondary! hover:bg-tertiary! rounded-xl! opacity-100! hover:opacity-100!'
                    />
                  </div>
                ))}
            </div>

            {!isLoading && (!domains || domains.length === 0) && (
              <div className='flex h-full items-center justify-center'>No domains found</div>
            )}
          </div>
        </div>
      </div>
    </AnimateIn>
  )
}

export default DisplayedCards
