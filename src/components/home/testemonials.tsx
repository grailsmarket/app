'use client'

import { TESTEMONIAL_QUOTES } from '@/constants/ui/testemonials'
import Image from 'next/image'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import quotes from 'public/icons/quotes.svg'
import arrow from 'public/icons/arrow-back.svg'
import User from '../ui/user'
import { Address } from 'viem'
import { useWindowSize } from 'ethereum-identity-kit'
import { cn } from '@/utils/tailwind'

const AUTO_ROTATE_MS = 8500

const getVisibleCount = (width: number | null): number => {
  if (!width || width < 768) return 1
  if (width < 1024) return 2
  return 3
}

export default function Testemonials() {
  const { width } = useWindowSize()
  const visibleCount = getVisibleCount(width)
  const total = TESTEMONIAL_QUOTES.length
  const needsCarousel = total > visibleCount
  const maxIndex = needsCarousel ? total - visibleCount : 0

  const [activeIndex, setActiveIndex] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    setActiveIndex((prev) => Math.min(prev, maxIndex))
  }, [maxIndex])

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (!needsCarousel) return

    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev >= maxIndex ? 0 : prev + 1))
    }, AUTO_ROTATE_MS)
  }, [needsCarousel, maxIndex])

  useEffect(() => {
    resetTimer()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [resetTimer])

  const goTo = useCallback(
    (index: number) => {
      setActiveIndex(index)
      resetTimer()
    },
    [resetTimer]
  )

  const goPrev = useCallback(() => {
    setActiveIndex((prev) => (prev <= 0 ? maxIndex : prev - 1))
    resetTimer()
  }, [maxIndex, resetTimer])

  const goNext = useCallback(() => {
    setActiveIndex((prev) => (prev >= maxIndex ? 0 : prev + 1))
    resetTimer()
  }, [maxIndex, resetTimer])

  const translateX = -(activeIndex * (100 / visibleCount))
  console.log(activeIndex)

  return (
    <div className='flex w-full flex-col items-center justify-center gap-4 sm:gap-6 md:gap-8 lg:items-start'>
      <h2 className='font-sedan-sc px-2 text-center text-4xl sm:text-5xl md:text-6xl lg:text-left'>
        What <span className='text-primary'>users</span> say about Grails
      </h2>

      {/* Carousel container */}
      <div className='relative w-full'>
        <div className='w-full overflow-hidden sm:overflow-visible'>
          <div
            className='flex min-w-full items-stretch transition-transform duration-500 ease-in-out'
            style={{ transform: `translateX(${translateX}%)` }}
          >
            {TESTEMONIAL_QUOTES.map((testimonial, i) => (
              <div
                key={testimonial.address}
                className='shrink-0 px-2 transition-all duration-400 lg:px-2'
                style={{
                  width: `${100 / visibleCount}%`,
                  maxWidth: '100%',
                  opacity: i > activeIndex + 2 || i < activeIndex ? 0 : 1,
                }}
              >
                <div className='bg-secondary flex h-full w-full flex-col justify-between gap-4 rounded-lg pt-5'>
                  <div className='flex flex-col gap-4 px-5'>
                    <Image src={quotes} alt='Quotes' width={24} height={24} />
                    <p className='text-[18px] text-wrap'>{testimonial.quote}</p>
                  </div>
                  <User
                    address={testimonial.address as Address}
                    className='h-16 w-full max-w-full gap-2 rounded-b-lg px-5'
                    wrapperClassName='max-w-full'
                    avatarSize='40px'
                    fontSize='18px'
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {needsCarousel && (
          <>
            <button
              type='button'
              onClick={goPrev}
              aria-label='Previous testimonial'
              className='bg-secondary/70 hover:bg-secondary absolute top-1/2 -left-2.5 z-10 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full shadow-sm backdrop-blur-sm transition-colors sm:-left-8 sm:h-10 sm:w-10 lg:-left-7 lg:h-12 lg:w-12 xl:-left-[min(calc(100vw-1286px),3rem)]'
            >
              <Image src={arrow} alt='' width={18} height={16} className='rotate-180' />
            </button>
            <button
              type='button'
              onClick={goNext}
              aria-label='Next testimonial'
              className='bg-secondary/70 hover:bg-secondary absolute top-1/2 -right-2.5 z-10 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full shadow-sm backdrop-blur-sm transition-colors sm:-right-8 sm:h-10 sm:w-10 lg:-right-7 lg:h-12 lg:w-12 xl:-right-[min(calc(100vw-1286px),3rem)]'
            >
              <Image src={arrow} alt='' width={18} height={16} />
            </button>
          </>
        )}
      </div>

      {/* Dots */}
      {needsCarousel && (
        <div className='mx-auto flex items-center justify-center gap-2'>
          {Array.from({ length: maxIndex + 1 }, (_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={cn(
                'h-2.5 cursor-pointer rounded-full transition-all duration-300',
                activeIndex === i ? 'bg-primary w-6' : 'bg-tertiary hover:bg-primary/50 w-2.5'
              )}
              aria-label={`Go to testimonial ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
