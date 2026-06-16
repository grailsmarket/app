'use client'

import React from 'react'
import { useSendGlobalMessage } from '@/hooks/chat/useSendGlobalMessage'
import { useGlobalQuota } from '@/hooks/chat/useGlobalQuota'
import { GLOBAL_CHAT_ID } from '@/constants/chat'
import Composer from '../chat/composer'
import { formatResetTime } from '@/utils/chat/formatters'
import type { ChatMessage } from '@/types/chat'

interface Props {
  replyingTo?: ChatMessage | null
  onCancelReply?: () => void
}

const GlobalComposer: React.FC<Props> = ({ replyingTo, onCancelReply }) => {
  const send = useSendGlobalMessage()
  const { data: quota } = useGlobalQuota()

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
      replyingTo={replyingTo}
      onCancelReply={onCancelReply}
    />
  )
}

export default GlobalComposer
