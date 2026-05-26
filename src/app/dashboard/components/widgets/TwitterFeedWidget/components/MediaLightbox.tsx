'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import type { ExpandedMedia, TwitterPostMedia } from '../types'
import { buildMediaLayoutId, buildVideoProxyUrl } from '../utils'
import { CloseIcon } from './Icons'

export const MediaLightbox: React.FC<{ expanded: ExpandedMedia | null; onClose: () => void }> = ({
  expanded,
  onClose,
}) => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!expanded) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKey)
    }
  }, [expanded, onClose])

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {expanded && (
        <motion.div
          key='twitter-media-lightbox'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className='fixed inset-0 z-200 flex h-dvh w-screen items-center justify-center bg-black/80 backdrop-blur-sm'
          onClick={onClose}
        >
          <button
            type='button'
            aria-label='Close'
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            className='absolute top-4 right-4 z-10 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80'
          >
            <CloseIcon />
          </button>
          <ExpandedMediaContent
            media={expanded.media}
            layoutId={buildMediaLayoutId(expanded.postId, expanded.media.key)}
          />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

const ExpandedMediaContent: React.FC<{ media: TwitterPostMedia; layoutId: string }> = ({ media, layoutId }) => {
  const mediaClassName = 'max-h-[90dvh] max-w-[92dvw] object-contain'
  const wrapperClassName = 'flex max-h-[90dvh] max-w-[92dvw] items-center justify-center'
  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation()
  const isVideo = media.type === 'video' || media.type === 'animated_gif'

  if (isVideo && media.url) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={wrapperClassName}
        onClick={stopPropagation}
      >
        <video
          key={media.key}
          src={buildVideoProxyUrl(media.url)}
          poster={media.previewImageUrl}
          controls
          autoPlay
          muted
          playsInline
          loop={media.type === 'animated_gif'}
          preload='auto'
          className={mediaClassName}
        />
      </motion.div>
    )
  }

  const imageSrc = media.url ?? media.previewImageUrl
  if (!imageSrc) return null

  return (
    <motion.div layoutId={layoutId} className={wrapperClassName} onClick={stopPropagation}>
      <img src={imageSrc} alt='' className={mediaClassName} />
    </motion.div>
  )
}
