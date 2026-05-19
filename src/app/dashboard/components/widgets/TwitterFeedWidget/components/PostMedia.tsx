'use client'

import React, { useState } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/utils/tailwind'
import type { TwitterPostMedia } from '../types'
import { buildMediaLayoutId } from '../utils'
import { ChevronIcon, PlayIcon } from './Icons'
import { MediaFallback } from './States'

export const PostMedia: React.FC<{
  postId: string
  media: TwitterPostMedia[]
  onExpand: (media: TwitterPostMedia) => void
}> = ({ postId, media, onExpand }) => {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeMedia = media[Math.min(activeIndex, media.length - 1)]
  const showCarouselControls = media.length > 1

  if (!activeMedia) return null

  const isVideo = activeMedia.type === 'video' || activeMedia.type === 'animated_gif'
  const previewSrc = activeMedia.type === 'photo' ? activeMedia.url : activeMedia.previewImageUrl
  const canExpand = Boolean(activeMedia.url || activeMedia.previewImageUrl)
  const layoutId = buildMediaLayoutId(postId, activeMedia.key)

  return (
    <div className='relative mt-3 overflow-hidden rounded-2xl border border-[#2f3336] bg-[#16181c]'>
      <div className='relative flex aspect-[16/10] items-center justify-center overflow-hidden'>
        {canExpand && previewSrc ? (
          <button
            type='button'
            onClick={() => onExpand(activeMedia)}
            aria-label={isVideo ? 'Play video' : 'Expand image'}
            className='group block h-full w-full cursor-zoom-in'
          >
            <motion.div layoutId={layoutId} className='h-full w-full'>
              <img src={previewSrc} alt='' className='h-full w-full object-cover' loading='lazy' />
            </motion.div>
            {isVideo && (
              <span className='pointer-events-none absolute inset-0 flex items-center justify-center'>
                <span className='flex h-14 w-14 items-center justify-center rounded-full bg-black/60 ring-1 ring-white/20 transition-transform duration-200 group-hover:scale-110'>
                  <PlayIcon />
                </span>
              </span>
            )}
          </button>
        ) : (
          <MediaFallback />
        )}

        {showCarouselControls && (
          <>
            <CarouselButton
              direction='previous'
              disabled={activeIndex === 0}
              onClick={() => setActiveIndex((index) => Math.max(index - 1, 0))}
            />
            <CarouselButton
              direction='next'
              disabled={activeIndex === media.length - 1}
              onClick={() => setActiveIndex((index) => Math.min(index + 1, media.length - 1))}
            />
          </>
        )}
      </div>

      {showCarouselControls && (
        <div className='absolute right-0 bottom-3 left-0 flex justify-center gap-1.5'>
          {media.map((item, index) => (
            <button
              key={item.key}
              type='button'
              aria-label={`Show media ${index + 1}`}
              onClick={(e) => {
                e.stopPropagation()
                setActiveIndex(index)
              }}
              className={cn(
                'h-1.5 w-1.5 cursor-pointer rounded-full',
                index === activeIndex ? 'bg-white' : 'bg-white/40'
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const CarouselButton: React.FC<{
  direction: 'previous' | 'next'
  disabled: boolean
  onClick: () => void
}> = ({ direction, disabled, onClick }) => (
  <button
    type='button'
    aria-label={direction === 'previous' ? 'Previous media' : 'Next media'}
    disabled={disabled}
    onClick={(e) => {
      e.stopPropagation()
      onClick()
    }}
    className={cn(
      'absolute top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-[#0f1419]/80 text-white transition-colors hover:bg-[#272c30] disabled:pointer-events-none disabled:opacity-0',
      direction === 'previous' ? 'left-3' : 'right-3'
    )}
  >
    <ChevronIcon className={cn('h-5 w-5', direction === 'previous' && 'rotate-180')} />
  </button>
)
