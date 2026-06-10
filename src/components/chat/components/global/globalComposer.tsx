'use client'

import React, { useCallback } from 'react'
import { format } from 'date-fns'
import { useSendGlobalMessage } from '@/hooks/chat/useSendGlobalMessage'
import { useGlobalQuota } from '@/hooks/chat/useGlobalQuota'
import { GLOBAL_CHAT_ID } from '@/constants/chat'
import type { SendMessageError } from '@/api/chats/sendMessage'
import type { SendGlobalMessageError } from '@/api/globalChat/sendMessage'
import Composer, { type MappedSendError } from '../chat/composer'

const formatResetTime = (resetsAt: string | undefined): string | null => {
  if (!resetsAt) return null
  const date = new Date(resetsAt)
  if (isNaN(date.getTime())) return null
  return format(date, 'h:mm a')
}

/**
 * Global-room composer: the shared Composer pointed at useSendGlobalMessage,
 * without typing-indicator emission, plus a daily quota footer and global
 * error mapping (quota, bans, room disabled).
 */
const GlobalComposer: React.FC = () => {
  const send = useSendGlobalMessage()
  const { data: quota } = useGlobalQuota()

  const mapSendError = useCallback((e: SendMessageError): MappedSendError | null => {
    const err = e as SendGlobalMessageError
    switch (err.code) {
      case 'QUOTA_EXCEEDED': {
        const limit = err.quota?.limit
        const resets = formatResetTime(err.quota?.resets_at)
        return {
          message: `Daily limit reached${limit ? ` (${limit}/day)` : ''}${resets ? ` — resets ${resets}` : ''}`,
          restoreText: true,
        }
      }
      case 'CHAT_BANNED':
        return { message: 'You have been banned from global chat', permanent: true }
      case 'GLOBAL_CHAT_DISABLED':
        return { message: 'Global chat is temporarily disabled', permanent: true }
      case 'MESSAGE_TOO_LONG':
        return { message: err.message ?? 'Message too long', restoreText: true }
      default:
        return null
    }
  }, [])

  const outOfQuota = quota?.remaining === 0
  const footerSlot =
    quota && quota.limit !== null ? (
      <p className='text-neutral mt-2 text-sm'>
        {outOfQuota
          ? `Daily limit reached (${quota.limit}/day)${formatResetTime(quota.resets_at) ? ` — resets ${formatResetTime(quota.resets_at)}` : ''}`
          : `${quota.remaining} ${quota.remaining === 1 ? 'message' : 'messages'} left today`}
      </p>
    ) : null

  return (
    <Composer
      chatId={GLOBAL_CHAT_ID}
      send={send}
      disableTyping
      disabled={outOfQuota}
      footerSlot={footerSlot}
      mapSendError={mapSendError}
    />
  )
}

export default GlobalComposer
