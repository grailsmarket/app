'use client'

import React, { useState } from 'react'
import { cn } from '@/utils/tailwind'
import ChatImage from './chatImage'
import ChatImageLightbox from './chatImageLightbox'
import type { MessageAttachment } from '@/types/chat'

interface Props {
  chatId: string
  attachments: MessageAttachment[]
}

const ChatImages: React.FC<Props> = ({ chatId, attachments }) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  if (attachments.length === 0) return null

  const single = attachments.length === 1
  const cols = attachments.length === 2 || attachments.length === 4 ? 'grid-cols-2' : 'grid-cols-3'

  return (
    <>
      {single ? (
        attachments[0].expired ? (
          <ChatImage chatId={chatId} attachment={attachments[0]} />
        ) : (
          <button type='button' onClick={() => setLightboxIndex(0)} className='block w-fit max-w-full cursor-pointer'>
            <ChatImage chatId={chatId} attachment={attachments[0]} />
          </button>
        )
      ) : (
        <div className={cn('grid w-fit gap-1', cols)}>
          {attachments.map((attachment, index) =>
            attachment.expired ? (
              <div key={attachment.url} className='h-24 w-24'>
                <ChatImage chatId={chatId} attachment={attachment} variant='thumb' />
              </div>
            ) : (
              <button
                key={attachment.url}
                type='button'
                onClick={() => setLightboxIndex(index)}
                className='h-24 w-24 cursor-pointer'
              >
                <ChatImage chatId={chatId} attachment={attachment} variant='thumb' />
              </button>
            )
          )}
        </div>
      )}
      {lightboxIndex !== null && (
        <ChatImageLightbox
          chatId={chatId}
          attachments={attachments}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  )
}

export default ChatImages
