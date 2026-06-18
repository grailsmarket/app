'use client'

import React from 'react'
import { API_ORIGIN } from '@/constants/api'
import { GLOBAL_CHAT_ID } from '@/constants/chat'
import { useProtectedImage } from '@/hooks/chat/useProtectedImage'
import { cn } from '@/utils/tailwind'
import type { MessageAttachment } from '@/types/chat'

type ChatImageVariant = 'full' | 'thumb' | 'lightbox'

const IMG_CLASS: Record<ChatImageVariant, string> = {
  full: 'max-h-80 w-auto max-w-full rounded-xl object-contain',
  thumb: 'h-full w-full rounded-lg object-cover',
  lightbox: 'max-h-[85vh] max-w-[90vw] rounded-lg object-contain',
}

const BOX_CLASS: Record<ChatImageVariant, string> = {
  full: 'h-48 w-64 max-w-full rounded-xl',
  thumb: 'h-full w-full rounded-lg',
  lightbox: 'h-[75vh] w-[85vw] rounded-xl',
}

interface Props {
  chatId: string
  attachment: MessageAttachment
  variant?: ChatImageVariant
}

const ChatImage: React.FC<Props> = ({ chatId, attachment, variant = 'full' }) => {
  const isGlobal = chatId === GLOBAL_CHAT_ID
  const fullUrl = `${API_ORIGIN}${attachment.url}`
  const protectedImg = useProtectedImage(isGlobal || attachment.expired ? null : fullUrl)

  const imgClass = IMG_CLASS[variant]
  const boxClass = cn(
    'bg-tertiary text-neutral flex items-center justify-center px-1 text-center text-sm',
    BOX_CLASS[variant]
  )

  if (attachment.expired) return <div className={boxClass}>Image expired</div>

  if (isGlobal) return <img src={fullUrl} alt='' loading='lazy' className={imgClass} />

  if (protectedImg.status === 'expired') return <div className={boxClass}>Image expired</div>

  if (protectedImg.status === 'error') return <div className={boxClass}>Image unavailable</div>

  if (!protectedImg.src) return <div className={cn(boxClass, 'animate-pulse')} />

  return <img src={protectedImg.src} alt='' className={imgClass} />
}

export default ChatImage
