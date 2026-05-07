'use client'
import React, { useEffect, useRef, useState } from 'react'
import { useChat } from '@/hooks/chat/useChat'
import { useChatMessages } from '@/hooks/chat/useChatMessages'
import { useE2ESession } from '@/hooks/chat/useE2ESession'
import { useE2EEnabled } from '@/hooks/chat/useE2EEnabled'
import { useUserContext } from '@/context/user'
import { handshakeBus } from '@/lib/e2e/handshakeBus'
import { sendMessage } from '@/api/chats/sendMessage'
import { encodeHandshake, tryDecode, isHandshakeEnvelope } from '@/lib/e2e/wire'
import { parseBundle } from '@/lib/e2e/olm'

interface Props {
  chatId: string
}

const E2EHandshakeBanner: React.FC<Props> = ({ chatId }) => {
  // While the PostHog flag is still loading we deliberately render nothing —
  // the composer-level gate handles the privacy-critical fail-closed path
  // (see threadView). Showing a flicker of "Unlock encryption" UI before
  // the flag resolves would be worse UX than the silent wait.
  const { enabled } = useE2EEnabled()
  const { userAddress } = useUserContext()

  const { data: chat } = useChat(chatId)
  const { messages, isLoading: msgsLoading } = useChatMessages(chatId)
  // Find ourselves in the participants list to get our chat-service user_id.
  // useE2ESession needs this to distinguish own-other-device handshakes
  // (supplemental fanout targets) from peer handshakes (real readiness).
  const myAddress = userAddress?.toLowerCase() ?? null
  const myUserId = chat?.participants?.find((p) => p.address.toLowerCase() === myAddress)?.user_id ?? null
  const e2e = useE2ESession(chatId, chat?.dm_key ?? null, myAddress, myUserId)

  // Effects must mirror the render-time guards: the banner returns null for
  // non-direct or blocked chats, but the cache-scan and bus-listener effects
  // would otherwise still fire — and could publish an `hs` setup message
  // into a group or blocked chat. Compute once, gate every effect on it.
  const isEligibleChat = chat?.type === 'direct' && !chat?.is_blocked_by_me

  // Guards against re-processing the same handshake row. Survives renders;
  // resets on banner unmount (the per-mount semantics are fine — the
  // expensive part is consumePeerBundle's outbound-session creation, which
  // useE2ESession itself tracks via sessionsRef).
  const processedHsRef = useRef<Set<string>>(new Set())

  // Tracked as state (not just a ref) so the manual "Send my keys" button
  // can render a spinner / disable itself while a publish is in flight,
  // preventing double-clicks that would post duplicate handshake messages.
  const [publishing, setPublishing] = useState(false)
  const publishingRef = useRef(false)
  const republishOurHandshake = async () => {
    if (publishingRef.current) return
    publishingRef.current = true
    setPublishing(true)
    try {
      const myBundle = await e2e.buildHandshakeBundle()
      await sendMessage({
        chatId,
        body: encodeHandshake({ v: 1, kind: 'hs', bundle: myBundle }),
      })
    } finally {
      publishingRef.current = false
      setPublishing(false)
    }
  }

  // Auto-publish our bundle once per chat after unlock if the cache shows
  // we've never sent ours in that chat. Tracked per chatId so the latch
  // doesn't carry across switches — a previously-seen direct chat that DID
  // auto-publish shouldn't suppress auto-publish in a different chat that
  // mounts later in the same banner instance.
  const autoPublishedChatsRef = useRef<Set<string>>(new Set())

  // Live WS path — fast for handshakes posted while the banner is mounted.
  useEffect(() => {
    if (!enabled || !isEligibleChat) return
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
  }, [chatId, e2e, enabled, isEligibleChat])

  // REST/cache path — catches handshakes posted while this tab was closed
  // or before unlock. Without this, a peer's handshake sitting in chat
  // history would only render as setup text and never actually establish
  // the session, so async setup would stall until another live handshake.
  useEffect(() => {
    if (!enabled || !isEligibleChat || !e2e.isUnlocked) return
    let cancelled = false
    ;(async () => {
      let sawOwnHandshake = false
      for (const m of messages) {
        if (cancelled) return
        if (m.id.startsWith('optimistic-')) continue
        const env = tryDecode(m.body)
        if (!env || !isHandshakeEnvelope(env)) continue
        // Identify OUR DEVICE's prior handshakes by Olm identity, not by
        // wallet address — sibling devices share the address but have
        // distinct Olm identities, and we want to consume their bundles
        // (multi-device fanout) rather than skip them as "own".
        let bundleIdentity: string | null = null
        try {
          bundleIdentity = parseBundle(env.bundle).identity
        } catch {
          // Malformed bundle — skip silently; consumePeerBundle would
          // throw too, this just avoids the noisy error log path.
          continue
        }
        if (bundleIdentity === e2e.ownDid) {
          sawOwnHandshake = true
          continue
        }
        if (processedHsRef.current.has(m.id)) continue
        try {
          const { isNew } = await e2e.consumePeerBundle(env.bundle, m.sender_user_id)
          // Only mark processed AFTER a successful consume. A transient
          // failure (e.g. parseBundle on a partially-corrupted body, or
          // an Olm error mid-init) would otherwise permanently suppress
          // retries for this message until the banner remounts.
          processedHsRef.current.add(m.id)
          if (isNew && !cancelled) await republishOurHandshake()
        } catch (err) {
          console.error(err)
        }
      }
      // Auto-publish our bundle once per chat if we've never sent one
      // for this chat. Wait for messages to finish loading first so we
      // don't duplicate an existing handshake that hasn't arrived in the
      // cache yet. `republishOurHandshake` is inflight-guarded, so a
      // concurrent republish triggered by an `isNew` peer bundle above is
      // a no-op.
      if (
        !cancelled &&
        !msgsLoading &&
        !sawOwnHandshake &&
        !autoPublishedChatsRef.current.has(chatId)
      ) {
        autoPublishedChatsRef.current.add(chatId)
        try {
          await republishOurHandshake()
        } catch (err) {
          console.error(err)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [enabled, isEligibleChat, e2e, e2e.isUnlocked, messages, msgsLoading, chatId])

  if (!enabled) return null
  if (!isEligibleChat) return null
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
        onClick={() => {
          republishOurHandshake().catch(console.error)
        }}
        disabled={publishing}
        className='bg-primary text-background rounded px-3 py-1 font-semibold transition-opacity disabled:cursor-not-allowed disabled:opacity-60'
      >
        {publishing ? 'Sending…' : 'Send my keys'}
      </button>
    </div>
  )
}

export default E2EHandshakeBanner
