'use client'
import React, { useEffect, useRef } from 'react'
import { useChat } from '@/hooks/chat/useChat'
import { useChatMessages } from '@/hooks/chat/useChatMessages'
import { useE2ESession } from '@/hooks/chat/useE2ESession'
import { useE2EEnabled } from '@/hooks/chat/useE2EEnabled'
import { handshakeBus } from '@/lib/e2e/handshakeBus'
import { sendMessage } from '@/api/chats/sendMessage'
import { encodeHandshake, tryDecode, isHandshakeEnvelope } from '@/lib/e2e/wire'

interface Props {
  chatId: string
}

const E2EHandshakeBanner: React.FC<Props> = ({ chatId }) => {
  const enabled = useE2EEnabled()

  const { data: chat } = useChat(chatId)
  const { messages } = useChatMessages(chatId)
  const e2e = useE2ESession(chatId, chat?.dm_key ?? null)

  // Guards against re-processing the same handshake row. Survives renders;
  // resets on banner unmount (the per-mount semantics are fine — the
  // expensive part is consumePeerBundle's outbound-session creation, which
  // useE2ESession itself tracks via sessionsRef).
  const processedHsRef = useRef<Set<string>>(new Set())

  // Republishing our own handshake is a side effect that must not be racy:
  // multiple new dids observed in quick succession should result in a single
  // handshake (or at most one per discovery batch). A simple inflight flag is
  // enough since consumePeerBundle is already idempotent.
  const republishingRef = useRef(false)
  const republishOurHandshake = async () => {
    if (republishingRef.current) return
    republishingRef.current = true
    try {
      const myBundle = await e2e.buildHandshakeBundle()
      await sendMessage({
        chatId,
        body: encodeHandshake({ v: 1, kind: 'hs', bundle: myBundle }),
      })
    } finally {
      republishingRef.current = false
    }
  }

  // Live WS path — fast for handshakes posted while the banner is mounted.
  useEffect(() => {
    if (!enabled) return
    const off = handshakeBus.on(async ({ chatId: cid, bundle, senderUserId }) => {
      if (cid !== chatId || !e2e.isUnlocked) return
      try {
        const { isNew } = await e2e.consumePeerBundle(bundle, senderUserId)
        if (isNew) await republishOurHandshake()
      } catch (e) {
        console.error(e)
      }
    })
    return off
  }, [chatId, e2e, enabled])

  // REST/cache path — catches handshakes posted while this tab was closed
  // or before unlock. Without this, a peer's handshake sitting in chat
  // history would only render as setup text and never actually establish
  // the session, so async setup would stall until another live handshake.
  useEffect(() => {
    if (!enabled || !e2e.isUnlocked) return
    let cancelled = false
    ;(async () => {
      for (const m of messages) {
        if (cancelled) return
        if (processedHsRef.current.has(m.id)) continue
        if (m.id.startsWith('optimistic-')) continue
        const env = tryDecode(m.body)
        if (!env || !isHandshakeEnvelope(env)) continue
        processedHsRef.current.add(m.id)
        try {
          const { isNew } = await e2e.consumePeerBundle(env.bundle, m.sender_user_id)
          if (isNew && !cancelled) await republishOurHandshake()
        } catch (err) {
          console.error(err)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [enabled, e2e, e2e.isUnlocked, messages, chatId])

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
          const bundle = await e2e.buildHandshakeBundle()
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
