'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Cross } from 'ethereum-identity-kit'
import { cn } from '@/utils/tailwind'
import ChatImage from './chatImage'
import type { MessageAttachment } from '@/types/chat'

interface Props {
  chatId: string
  attachments: MessageAttachment[]
  initialIndex: number
  onClose: () => void
}

const NAV_BUTTON =
  'absolute top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-3xl leading-none text-white transition-colors hover:bg-white/20'

const ChatImageLightbox: React.FC<Props> = ({ chatId, attachments, initialIndex, onClose }) => {
  const [index, setIndex] = useState(initialIndex)
  const count = attachments.length

  const step = useCallback((delta: number) => setIndex((i) => (i + delta + count) % count), [count])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      } else if (e.key === 'ArrowRight') {
        e.stopPropagation()
        step(1)
      } else if (e.key === 'ArrowLeft') {
        e.stopPropagation()
        step(-1)
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onClose, step])

  if (typeof document === 'undefined') return null
  const current = attachments[index]
  if (!current) return null

  return createPortal(
    <div
      role='dialog'
      aria-modal='true'
      onClick={onClose}
      className='fixed inset-0 z-100 flex items-center justify-center bg-black/80 p-4'
    >
      <button
        type='button'
        onClick={onClose}
        aria-label='Close'
        className='absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20'
      >
        <Cross className='h-4 w-4' />
      </button>

      {count > 1 && (
        <>
          <button
            type='button'
            aria-label='Previous image'
            onClick={(e) => {
              e.stopPropagation()
              step(-1)
            }}
            className={cn(NAV_BUTTON, 'left-4')}
          >
            ‹
          </button>
          <button
            type='button'
            aria-label='Next image'
            onClick={(e) => {
              e.stopPropagation()
              step(1)
            }}
            className={cn(NAV_BUTTON, 'right-4')}
          >
            ›
          </button>
          <div className='absolute bottom-4 rounded-full bg-white/10 px-3 py-1 text-sm text-white'>
            {index + 1} / {count}
          </div>
        </>
      )}

      <div onClick={(e) => e.stopPropagation()} className='flex max-h-full max-w-full items-center justify-center'>
        <ChatImage chatId={chatId} attachment={current} variant='lightbox' />
      </div>
    </div>,
    document.body
  )
}

export default ChatImageLightbox
