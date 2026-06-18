'use client'

import React from 'react'
import { API_ORIGIN } from '@/constants/api'
import { GLOBAL_CHAT_ID } from '@/constants/chat'
import { useProtectedImage } from '@/hooks/chat/useProtectedImage'
import { cn } from '@/utils/tailwind'
import type { MessageAttachment } from '@/types/chat'

interface Props {
  chatId: string
  attachment: MessageAttachment
}

const IMG_CLASS = 'max-h-80 w-auto max-w-full rounded-xl object-contain'
const BOX_CLASS = 'flex h-48 w-64 max-w-full items-center justify-center rounded-xl'

const Placeholder: React.FC<{ label: string }> = ({ label }) => (
  <div className={cn(BOX_CLASS, 'bg-tertiary text-neutral text-md')}>{label}</div>
)

/**
 * Renders a chat image attachment. Global-room images are public and load
 * directly; DM/group images are auth-gated and fetched via useProtectedImage.
 */
const ChatImage: React.FC<Props> = ({ chatId, attachment }) => {
  const isGlobal = chatId === GLOBAL_CHAT_ID
  const fullUrl = `${API_ORIGIN}${attachment.url}`
  const protectedImg = useProtectedImage(isGlobal || attachment.expired ? null : fullUrl)

  if (attachment.expired) return <Placeholder label='Image expired' />

  if (isGlobal) {
    return <img src={fullUrl} alt='' loading='lazy' className={IMG_CLASS} />
  }

  if (protectedImg.status === 'expired') return <Placeholder label='Image expired' />
  if (protectedImg.status === 'error') return <Placeholder label='Image unavailable' />
  if (!protectedImg.src) return <div className={cn(BOX_CLASS, 'bg-tertiary animate-pulse')} />

  return <img src={protectedImg.src} alt='' className={IMG_CLASS} />
}

export default ChatImage
