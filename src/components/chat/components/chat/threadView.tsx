'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { Avatar, Cross, HeaderImage } from 'ethereum-identity-kit'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { closeChatSidebar, openSidebarToList, selectChatSidebar } from '@/state/reducers/chat/sidebar'
import { selectTypingForChat } from '@/state/reducers/chat/typing'
import { useChat } from '@/hooks/chat/useChat'
import { useChatMessages } from '@/hooks/chat/useChatMessages'
import { useMarkRead } from '@/hooks/chat/useMarkRead'
import { useChatsInbox } from '@/hooks/chat/useChatsInbox'
import { usePeerProfile } from '@/hooks/chat/usePeerProfile'
import { useBlockUser } from '@/hooks/chat/useBlockUser'
import { useUnblockUser } from '@/hooks/chat/useUnblockUser'
import { useUserContext } from '@/context/user'
import LoadingCell from '@/components/ui/loadingCell'
import ContextMenu, { type ContextMenuItem } from '@/components/ui/contextMenu'
import MessageRow from './messageRow'
import Composer from './composer'
import TypingDots from './typingDots'
import E2EHandshakeBanner from './e2eHandshakeBanner'
import { sessionRegistry } from '@/lib/e2e/sessionRegistry'
import { useE2EEnabled } from '@/hooks/chat/useE2EEnabled'
import ArrowBack from 'public/icons/arrow-back.svg'
import { cn } from '@/utils/tailwind'
import type { ChatMessage, ChatParticipant } from '@/types/chat'
import { ENS_METADATA_URL } from '@/constants/ens'
import Link from 'next/link'

const ThreadView: React.FC = () => {
  const dispatch = useAppDispatch()
  const { activeChatId } = useAppSelector(selectChatSidebar)
  const { userAddress } = useUserContext()
  const e2eEnabled = useE2EEnabled()

  // Subscribe to sessionRegistry so the composer disables/enables in real
  // time as the banner moves the chat through `unlocked → no_session → ready`.
  const [, forceTick] = useState(0)
  useEffect(() => sessionRegistry.subscribe(() => forceTick((t) => t + 1)), [])
  const e2eReady = !!(activeChatId && sessionRegistry.get(activeChatId)?.isReady())

  const { data: chat, isLoading: chatLoading } = useChat(activeChatId)
  const {
    messages,
    isLoading: msgsLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useChatMessages(activeChatId)
  const markRead = useMarkRead()
  // Reads inbox cache only — keeps participants/unread state in sync via WS.
  useChatsInbox()

  const typingUserIds = useAppSelector(selectTypingForChat(activeChatId))

  const myAddress = userAddress?.toLowerCase()
  const otherParticipants: ChatParticipant[] = useMemo(
    () => (chat?.participants ?? []).filter((p) => p.address.toLowerCase() !== myAddress),
    [chat, myAddress]
  )
  const peer = otherParticipants[0]
  const peerProfile = usePeerProfile(peer?.address)
  const isBlocked = !!chat?.is_blocked_by_me

  // Pause composer only when the user opted into E2E for an unready DIRECT
  // chat. Group chats have no E2E mechanism (Olm is 1:1) so locking sends
  // for them when the user is in the rollout cohort would break group DMs.
  const blockSendsForE2E = e2eEnabled && !e2eReady && chat?.type === 'direct'

  const blockMutation = useBlockUser()
  const unblockMutation = useUnblockUser()

  // Auto-scroll to bottom on new messages.
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastSeenCount = useRef(0)
  useEffect(() => {
    if (!scrollRef.current) return
    if (messages.length > lastSeenCount.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
    lastSeenCount.current = messages.length
  }, [messages.length])

  // Adjust for the virtual keyboard along with keeping the latest message visible
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return
    const vv = window.visualViewport
    let previousHeight = vv.height
    let pinning = false

    const KEYBOARD_REVEAL_THRESHOLD = 80
    const PIN_DURATION_MS = 350

    const pinToBottom = () => {
      if (pinning) return
      pinning = true
      const start = performance.now()
      const tick = () => {
        const el = scrollRef.current
        if (el) el.scrollTop = el.scrollHeight
        if (performance.now() - start < PIN_DURATION_MS) {
          requestAnimationFrame(tick)
        } else {
          pinning = false
        }
      }
      requestAnimationFrame(tick)
    }

    const onResize = () => {
      const nextHeight = vv.height
      if (nextHeight < previousHeight - KEYBOARD_REVEAL_THRESHOLD) {
        pinToBottom()
      }
      previousHeight = nextHeight
    }

    vv.addEventListener('resize', onResize)
    return () => {
      vv.removeEventListener('resize', onResize)
    }
  }, [])

  // when the thread is open and there are messages, mark the newest as read.
  useEffect(() => {
    if (!activeChatId || messages.length === 0) return
    const newest: ChatMessage | undefined = messages[messages.length - 1]
    if (!newest) return
    if (newest.id.startsWith('optimistic-')) return
    markRead.mutate({ chatId: activeChatId, upToMessageId: newest.id })
    // Re-run on chat change or new tail.
  }, [activeChatId, messages[messages.length - 1]?.id])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const t = e.currentTarget
    if (t.scrollTop < 200 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }

  const peerLabel = peerProfile?.displayLabel ?? 'Direct chat'

  // Filter typing events to peers only (don't show our own typing back to us).
  const otherTypingIds = peer ? typingUserIds.filter((id) => id === peer.user_id) : []

  const headerMenuItems: ContextMenuItem[] = peer
    ? isBlocked
      ? [
        {
          label: `Unblock ${peerLabel}`,
          onClick: () => unblockMutation.mutate(peer.user_id),
        },
      ]
      : [
        {
          label: `Block ${peerLabel}`,
          confirmLabel: `Confirm block ${peerLabel}`,
          destructive: true,
          onClick: () => blockMutation.mutate(peer.address),
        },
      ]
    : []

  return (
    <>
      <div className='border-tertiary relative flex items-center justify-between gap-2 border-b-2 p-3'>
        {peerProfile?.records['header'] && (
          <HeaderImage
            name={peerProfile?.ensName ?? undefined}
            src={`${ENS_METADATA_URL}/mainnet/header/${peerProfile?.ensName}`}
            isLoading={false}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              position: 'absolute',
              top: 0,
              left: 0,
              opacity: 0.15,
            }}
          />
        )}
        <button
          onClick={() => dispatch(openSidebarToList())}
          className='hover:bg-primary/10 rounded-md p-1 transition-colors'
          aria-label='Back to chats'
        >
          <Image src={ArrowBack} alt='' width={16} height={16} className='rotate-180' />
        </button>
        <Link
          href={`/profile/${peer?.address}`}
          prefetch
          onClick={() => dispatch(closeChatSidebar())}
          className='relative flex min-w-0 flex-1 cursor-pointer items-center gap-2 transition-opacity hover:opacity-80'
        >
          {peerProfile?.ensName ? (
            <Avatar
              key={peerProfile?.avatar ?? `${peer.address}-default`}
              address={peer?.address as `0x${string}`}
              src={`${ENS_METADATA_URL}/mainnet/avatar/${peerProfile.ensName}`}
              name={peerProfile?.ensName ?? undefined}
              style={{ width: '36px', height: '36px' }}
            />
          ) : (
            <LoadingCell height='36px' width='36px' radius='18px' />
          )}
          <p className='text-foreground max-w-[calc(100%-44px)] truncate text-xl font-semibold'>{peerLabel}</p>
        </Link>
        <div className='relative flex items-center gap-1'>
          {headerMenuItems.length > 0 && <ContextMenu items={headerMenuItems} />}
          <button
            onClick={() => dispatch(closeChatSidebar())}
            className='hover:bg-primary/10 rounded-md p-1 transition-colors'
            aria-label='Close'
          >
            <Cross className='text-foreground h-4 w-4 cursor-pointer' />
          </button>
        </div>
      </div>

      {activeChatId && <E2EHandshakeBanner chatId={activeChatId} />}

      <div ref={scrollRef} onScroll={handleScroll} className='flex-1 overflow-y-auto p-3'>
        {chatLoading || msgsLoading ? (
          <div className='flex flex-col gap-2'>
            {Array.from({ length: 6 }).map((_, i) => (
              <LoadingCell key={i} height='32px' width={i % 2 === 0 ? '60%' : '50%'} />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <p className='text-neutral text-md mt-8 text-center'>No messages yet — say hi.</p>
        ) : (
          <div className='flex flex-col gap-3'>
            {isFetchingNextPage && (
              <div className='py-2 text-center'>
                <span className='text-neutral text-sm'>Loading older messages…</span>
              </div>
            )}
            {messages.map((m) => (
              <MessageRow
                key={m.id}
                message={m}
                isOwn={m.sender_address?.toLowerCase() === myAddress}
                isRead={m.id === peer?.last_read_message_id}
              />
            ))}
            {otherTypingIds.length > 0 && (
              <div className={cn('flex items-center gap-2 pt-1')}>
                <div className='bg-secondary rounded-2xl rounded-bl-sm px-4 py-2'>
                  <TypingDots />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {activeChatId &&
        (isBlocked ? (
          <div className='border-tertiary flex items-center justify-between gap-3 border-t-2 p-3'>
            <p className='text-neutral text-md'>You&apos;ve blocked {peerLabel}. Unblock to send messages.</p>
            <button
              onClick={() => peer && unblockMutation.mutate(peer.user_id)}
              disabled={!peer || unblockMutation.isPending}
              className='bg-primary text-background text-md rounded-sm px-3 py-1.5 font-bold transition-all hover:opacity-80 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50'
            >
              {unblockMutation.isPending ? 'Unblocking…' : 'Unblock'}
            </button>
          </div>
        ) : (
          // When the user has opted into E2E (`?e2e=1`) but no session is
          // ready yet, refuse to send: useSendMessage's plaintext fallback
          // would silently leak the message in the clear, which contradicts
          // what the visible banner is telling the user. See `blockSendsForE2E`
          // above for the direct-chat-only scoping.
          <Composer
            chatId={activeChatId}
            disabled={blockSendsForE2E}
            disabledReason={
              blockSendsForE2E ? 'Setting up encryption with this peer — sending paused.' : null
            }
          />
        ))}
    </>
  )
}

export default ThreadView
