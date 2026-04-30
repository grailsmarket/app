'use client'

import React, { useEffect, useMemo, useRef } from 'react'
import Image from 'next/image'
import { Avatar, Cross } from 'ethereum-identity-kit'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import {
  closeChatSidebar,
  openSidebarToList,
  selectChatSidebar,
} from '@/state/reducers/chat/sidebar'
import { selectTypingForChat } from '@/state/reducers/chat/typing'
import { useChat } from '@/hooks/chat/useChat'
import { useChatMessages } from '@/hooks/chat/useChatMessages'
import { useMarkRead } from '@/hooks/chat/useMarkRead'
import { useChatsInbox } from '@/hooks/chat/useChatsInbox'
import { useUserContext } from '@/context/user'
import { formatAddress } from '@/utils/formatAddress'
import LoadingCell from '@/components/ui/loadingCell'
import MessageRow from './messageRow'
import Composer from './composer'
import TypingDots from './typingDots'
import ReadReceipt from './readReceipt'
import ArrowBack from 'public/icons/arrow-back.svg'
import { cn } from '@/utils/tailwind'
import type { ChatMessage, ChatParticipant } from '@/types/chat'

const ThreadView: React.FC = () => {
  const dispatch = useAppDispatch()
  const { activeChatId } = useAppSelector(selectChatSidebar)
  const { userAddress } = useUserContext()

  const { data: chat, isLoading: chatLoading } = useChat(activeChatId)
  const { messages, isLoading: msgsLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useChatMessages(activeChatId)
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

  // Mark-read: when the thread is open and there are messages, mark the newest as read.
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

  const lastOwnMessage = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i]
      if (m.sender_address?.toLowerCase() === myAddress) return m
    }
    return null
  }, [messages, myAddress])

  const peerLabel = peer ? formatAddress(peer.address) : 'Direct chat'

  // Filter typing events to peers only (don't show our own typing back to us).
  const otherTypingIds = peer
    ? typingUserIds.filter((id) => id === peer.user_id)
    : []

  return (
    <>
      <div className='border-tertiary flex items-center justify-between gap-2 border-b-2 p-3'>
        <button
          onClick={() => dispatch(openSidebarToList())}
          className='hover:bg-primary/10 rounded-md p-1 transition-colors'
          aria-label='Back to chats'
        >
          <Image src={ArrowBack} alt='' width={16} height={16} />
        </button>
        <div className='flex min-w-0 flex-1 items-center gap-2'>
          {peer ? (
            <Avatar address={peer.address as `0x${string}`} style={{ width: '32px', height: '32px' }} />
          ) : (
            <div className='bg-tertiary h-8 w-8 rounded-full' />
          )}
          <p className='text-foreground truncate text-lg font-semibold'>{peerLabel}</p>
        </div>
        <button
          onClick={() => dispatch(closeChatSidebar())}
          className='hover:bg-primary/10 rounded-md p-1 transition-colors'
          aria-label='Close'
        >
          <Cross className='text-foreground h-4 w-4 cursor-pointer' />
        </button>
      </div>

      <div ref={scrollRef} onScroll={handleScroll} className='flex-1 overflow-y-auto p-3'>
        {chatLoading || msgsLoading ? (
          <div className='flex flex-col gap-2'>
            {Array.from({ length: 6 }).map((_, i) => (
              <LoadingCell key={i} height='32px' width={i % 2 === 0 ? '60%' : '50%'} />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <p className='text-neutral mt-8 text-center text-md'>No messages yet — say hi.</p>
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
              />
            ))}
            <ReadReceipt
              lastOwnMessage={lastOwnMessage}
              messages={messages}
              otherParticipants={otherParticipants}
            />
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

      {activeChatId && <Composer chatId={activeChatId} />}
    </>
  )
}

export default ThreadView
