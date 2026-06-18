'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { isSameDay } from 'date-fns'
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
import ContextMenu, { type ContextMenuItem } from '../contextMenu'
import MessageRow from './messageRow'
import MessageRowSkeleton from './messageRowSkeleton'
import Composer from './composer'
import TypingDots from './typingDots'
import DayDivider from './dayDivider'
import ArrowBack from 'public/icons/arrow-back.svg'
import { cn } from '@/utils/tailwind'
import type { ChatMessage, ChatParticipant } from '@/types/chat'
import { ENS_METADATA_URL } from '@/constants/ens'
import Link from 'next/link'
import { useThreadView } from '../../hooks/useThreadView'
import { useNewMessageGate } from '../../hooks/useNewMessageGate'

const ThreadView: React.FC = () => {
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  const dispatch = useAppDispatch()
  const { userAddress } = useUserContext()
  const { activeChatId } = useAppSelector(selectChatSidebar)
  const typingUserIds = useAppSelector(selectTypingForChat(activeChatId))

  const { data: chat, isLoading: chatLoading } = useChat(activeChatId)
  const {
    messages,
    isLoading: msgsLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useChatMessages(activeChatId)
  const markRead = useMarkRead()
  const blockMutation = useBlockUser()
  const unblockMutation = useUnblockUser()
  const { scrollRef, handleScroll } = useThreadView({ messages, hasNextPage, isFetchingNextPage, fetchNextPage })
  // Animate messages that land live (from a peer) while the thread is open.
  const isNewMessage = useNewMessageGate(messages, activeChatId ?? undefined, !msgsLoading)

  // Reads inbox cache only — keeps participants/unread state in sync via WS.
  useChatsInbox()

  // Drop any pending reply target when switching chats.
  useEffect(() => setReplyingTo(null), [activeChatId])

  const myAddress = userAddress?.toLowerCase()
  const otherParticipants: ChatParticipant[] = useMemo(
    () => (chat?.participants ?? []).filter((p) => p.address.toLowerCase() !== myAddress),
    [chat, myAddress]
  )
  const peer = otherParticipants[0]
  const peerProfile = usePeerProfile(peer?.address)
  const isBlocked = !!chat?.is_blocked_by_me

  // when the thread is open and there are messages, mark the newest as read.
  useEffect(() => {
    if (!activeChatId || messages.length === 0) return

    const newest: ChatMessage | undefined = messages[messages.length - 1]
    if (!newest) return

    if (newest.id.startsWith('optimistic-')) return

    markRead.mutate({ chatId: activeChatId, upToMessageId: newest.id })
    // Re-run on chat change or new tail.
  }, [activeChatId, messages[messages.length - 1]?.id])

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
      <div className='border-tertiary relative z-20 flex h-14.5 items-center justify-between gap-2 border-b-2 pr-3 pl-4'>
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
              borderTopLeftRadius: '0px',
              borderTopRightRadius: '0px',
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
          {headerMenuItems.length > 0 && (
            <ContextMenu
              open={menuOpen}
              onOpenChange={setMenuOpen}
              items={headerMenuItems}
              position='top'
              align='right'
            />
          )}
          <button
            onClick={() => dispatch(closeChatSidebar())}
            className='hover:bg-primary/10 rounded-md p-1 transition-colors'
            aria-label='Close'
          >
            <Cross className='text-foreground h-4 w-4 cursor-pointer' />
          </button>
        </div>
      </div>

      <div ref={scrollRef} onScroll={handleScroll} className='flex-1 overflow-y-auto p-3'>
        {chatLoading || msgsLoading ? (
          <div className='flex flex-col gap-2'>
            {['55%', '40%', '60%', '35%', '50%', '45%'].map((width, i) => (
              <MessageRowSkeleton key={i} isOwn={i % 2 === 1} width={width} />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <p className='text-neutral text-md mt-8 text-center'>No messages yet — say hi.</p>
        ) : (
          <div className='flex flex-col gap-2'>
            {isFetchingNextPage && (
              <div className='flex flex-col gap-3'>
                {['55%', '40%', '60%', '35%', '50%', '45%'].map((width, i) => (
                  <MessageRowSkeleton key={i} isOwn={i % 2 === 1} width={width} />
                ))}
              </div>
            )}
            {messages.map((message, i) => {
              if (!activeChatId) return null
              const current = new Date(message.created_at)
              const previous = i > 0 ? new Date(messages[i - 1].created_at) : null
              const startsNewDay = !previous || !isSameDay(current, previous)
              const isOwn = message.sender_address?.toLowerCase() === myAddress
              return (
                <React.Fragment key={message.id}>
                  {startsNewDay && <DayDivider date={current} />}
                  <MessageRow
                    chatId={activeChatId}
                    message={message}
                    isOwn={isOwn}
                    isRead={message.id === peer?.last_read_message_id}
                    onReply={setReplyingTo}
                    animate={!isOwn && isNewMessage(message)}
                    next={i < messages.length - 1 ? messages[i + 1] : null}
                    menuPosition={messages.length > 6 && i < messages.length - 3 ? 'top' : 'bottom'}
                  />
                </React.Fragment>
              )
            })}
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
          <Composer
            chatId={activeChatId}
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
            onRestoreReply={(message) => setReplyingTo(message)}
          />
        ))}
    </>
  )
}

export default ThreadView
