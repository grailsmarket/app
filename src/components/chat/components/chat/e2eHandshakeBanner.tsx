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
import { shouldAutoPublishHandshake } from './shouldAutoPublishHandshake'

interface Props {
  chatId: string
}

// Outer wrapper: when the feature gate flips off (PostHog cohort change,
// `?e2e=1` removed via navigation), the inner sub-component unmounts. That
// triggers `useE2ESession`'s cleanup effect, which unregisters from the
// session registry — without this split, the registry would stay populated
// and `useSendMessage` would keep encrypting after the rollout/kill switch
// said E2E is off for this tab.
const E2EHandshakeBanner: React.FC<Props> = ({ chatId }) => {
  const { enabled } = useE2EEnabled()
  // While the PostHog flag is still loading we deliberately render nothing —
  // the composer-level gate handles the privacy-critical fail-closed path
  // (see threadView). Showing a flicker of "Unlock encryption" UI before
  // the flag resolves would be worse UX than the silent wait.
  if (!enabled) return null
  return <E2EHandshakeBannerInner chatId={chatId} />
}

const E2EHandshakeBannerInner: React.FC<Props> = ({ chatId }) => {
  const { userAddress } = useUserContext()

  const { data: chat } = useChat(chatId)
  const { messages, isLoading: msgsLoading } = useChatMessages(chatId)
  // Find ourselves in the participants list to get our chat-service user_id.
  // useE2ESession needs this to distinguish own-other-device handshakes
  // (supplemental fanout targets) from peer handshakes (real readiness).
  const myAddress = userAddress?.toLowerCase() ?? null
  const myUserId = chat?.participants?.find((p) => p.address.toLowerCase() === myAddress)?.user_id ?? null
  const dmKey = chat?.dm_key ?? null
  const e2e = useE2ESession(chatId, dmKey, myAddress, myUserId)

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
      // Persist the per-chat "I've published" flag AFTER the POST succeeds,
      // not before. If sendMessage rejects (network drop, 5xx) we leave the
      // flag unset so the next mount will retry — marking it eagerly would
      // suppress the retry and strand the peer without our bundle. Errors
      // from this call are swallowed: a successful send + failed flag write
      // is a degraded but recoverable state (next mount re-publishes, peer
      // ignores the duplicate via their own outboundSessionsRef cache).
      try {
        await e2e.markOwnHandshakePublished()
      } catch (err) {
        console.error(err)
      }
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
    if (!isEligibleChat) return
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
  }, [chatId, e2e, isEligibleChat])

  // REST/cache path — catches handshakes posted while this tab was closed
  // or before unlock. Without this, a peer's handshake sitting in chat
  // history would only render as setup text and never actually establish
  // the session, so async setup would stall until another live handshake.
  useEffect(() => {
    // Wait for the hook's dmKey effect to finish restoring (roster + sessions
    // + published flag) from IndexedDB before scanning. The gate is a dmKey
    // MATCH, not a boolean — a stale "restored=true" carried over from a
    // previous chat / previous unlock window cannot pass, because the loaded
    // dmKey won't equal the current dmKey. Without this gate the auto-publish
    // fallback below would read default-`false` values for hasPublishedForChat
    // / isReady during the unlock-to-load window, which would (incorrectly)
    // green-light a republish on a chat where our own handshake row is
    // paginated outside the visible message page. The disk-fallback inside
    // consumePeerBundle handles its own race; this gate protects the FALLBACK
    // auto-publish decision specifically.
    if (
      !isEligibleChat ||
      !e2e.isUnlocked ||
      dmKey == null ||
      e2e.restoredForDmKey !== dmKey
    )
      return
    let cancelled = false
      ; (async () => {
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
        // Backfill the persisted flag if our own handshake row is visible
        // in the cached window but the on-disk flag is still false. Two
        // cases this covers:
        //   - Chats whose handshake was sent before the persisted-flag
        //     mechanism existed (no migration was written; the flag
        //     stays missing).
        //   - Chats where markOwnHandshakePublished previously threw
        //     (IDB quota, private-window quirks) and the flag never
        //     landed despite the publish succeeding.
        // Without this, once the visible row ages past the first 50
        // messages, sawOwnHandshake flips back to false and the
        // auto-publish fallback fires a duplicate. The backfill is
        // idempotent — markOwnHandshakePublished writes a single-byte
        // blob; the storageKey it captures is the same one this scan
        // ran against, so a wallet switch can't race it.
        if (!cancelled && sawOwnHandshake && !e2e.hasPublishedForChat) {
          try {
            await e2e.markOwnHandshakePublished()
          } catch (err) {
            console.error(err)
          }
        }
        // Auto-publish our bundle once per chat if we've never sent one for
        // this chat. The decision is delegated to a pure helper so its
        // suppression rules are unit-testable without a DOM harness. The
        // critical input beyond the local scan state is:
        //   - e2e.hasPublishedForChat: persisted IndexedDB flag (set ONLY
        //     after a successful sendMessage POST), survives refresh,
        //     independent of message pagination — defeats the "own
        //     handshake row paginated past first 50" failure mode.
        // We deliberately do NOT gate on e2e.isReady: ready means we have
        // a peer session in memory (constructed from THEIR bundle), not
        // that we've broadcast ours. If the very first send failed but
        // consumePeerBundle already established sessions, isReady would
        // be true while the peer is still waiting on our bundle — gating
        // on it would lock us out of retrying.
        // `republishOurHandshake` is inflight-guarded, so a concurrent call
        // triggered by an `isNew` peer bundle above is a no-op.
        if (
          shouldAutoPublishHandshake({
            cancelled,
            msgsLoading,
            sawOwnHandshake,
            alreadyAttemptedThisMount: autoPublishedChatsRef.current.has(chatId),
            hasPersistedPublishedFlag: e2e.hasPublishedForChat,
          })
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
  }, [isEligibleChat, e2e, e2e.isUnlocked, e2e.restoredForDmKey, dmKey, messages, msgsLoading, chatId])

  if (!isEligibleChat) return null
  if (e2e.state.kind === 'ready') return null

  if (!e2e.isUnlocked) {
    return (
      <div className='border-tertiary flex justify-between items-center bg-secondary/40 border-b p-3 text-center'>
        <p className='text-md text-left font-medium'><span className='text-xl leading-none'>🔒</span> This chat supports end-to-end encryption.</p>
        <button
          type='button'
          onClick={() => {
            e2e.unlock().catch(console.error)
          }}
          className='bg-primary text-background rounded px-3 py-1.5 text-md font-semibold hover:opacity-80 transition-opacity cursor-pointer'
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
