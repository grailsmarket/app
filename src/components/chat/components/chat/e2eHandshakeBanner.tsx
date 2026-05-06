'use client'
import React, { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useChat } from '@/hooks/chat/useChat'
import { useE2ESession } from '@/hooks/chat/useE2ESession'
import { handshakeBus } from '@/lib/e2e/handshakeBus'
import { sendMessage } from '@/api/chats/sendMessage'
import { encodeHandshake } from '@/lib/e2e/wire'

interface Props {
  chatId: string
}

const E2EHandshakeBanner: React.FC<Props> = ({ chatId }) => {
  const search = useSearchParams()
  const enabled = search?.get('e2e') === '1'

  const { data: chat } = useChat(chatId)
  const e2e = useE2ESession(chatId, chat?.dm_key ?? null)

  useEffect(() => {
    if (!enabled) return
    const off = handshakeBus.on(({ chatId: cid, bundle }) => {
      if (cid !== chatId || !e2e.isUnlocked) return
      e2e.consumePeerBundle(bundle).catch(console.error)
    })
    return off
  }, [chatId, e2e, enabled])

  if (!enabled) return null
  if (chat?.type !== 'direct') return null
  if (chat?.is_blocked_by_me) return null
  if (e2e.state.kind === 'ready') return null

  if (!e2e.isUnlocked) {
    return (
      <div className='border-tertiary bg-secondary/40 border-b p-3 text-center text-sm'>
        <p className='mb-2'>🔒 This chat supports end-to-end encryption.</p>
        <button
          type='button'
          onClick={() => {
            e2e.unlock().catch(console.error)
          }}
          className='bg-primary text-background rounded px-3 py-1 font-semibold'
        >
          Unlock encryption
        </button>
      </div>
    )
  }

  return (
    <div className='border-tertiary bg-secondary/40 border-b p-3 text-center text-sm'>
      <p className='mb-2'>Setting up encryption with this peer…</p>
      <button
        type='button'
        onClick={async () => {
          const bundle = e2e.buildHandshakeBundle()
          await sendMessage({
            chatId,
            body: encodeHandshake({ v: 1, kind: 'hs', bundle }),
          })
        }}
        className='bg-primary text-background rounded px-3 py-1 font-semibold'
      >
        Send my keys
      </button>
    </div>
  )
}

export default E2EHandshakeBanner
