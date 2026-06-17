'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { isSameDay } from 'date-fns'
import { Cross } from 'ethereum-identity-kit'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useAppDispatch } from '@/state/hooks'
import { closeChatSidebar, openSidebarToList } from '@/state/reducers/chat/sidebar'
import { useGlobalMessages } from '@/hooks/chat/useGlobalMessages'
import { useOnlineUsers } from '@/hooks/chat/useOnlineUsers'
import { useUserContext } from '@/context/user'
import PrimaryButton from '@/components/ui/buttons/primary'
import GlobalMessageRow from './globalMessageRow'
import GlobalMessageRowSkeleton from './globalMessageRowSkeleton'
import GlobalComposer from './globalComposer'
import OnlinePanel from './onlinePanel'
import DayDivider from '../chat/dayDivider'
import ArrowBack from 'public/icons/arrow-back.svg'
import Logo from 'public/logo.svg'
import type { ChatMessage } from '@/types/chat'
import { useThreadView } from '../../hooks/useThreadView'
import { useNewMessageGate } from '../../hooks/useNewMessageGate'
import { GLOBAL_CHAT_ID } from '@/constants/chat'
import { startsNewRun } from '@/utils/chat/message'

const GlobalThreadView: React.FC = () => {
  const dispatch = useAppDispatch()
  const { userAddress, authStatus, handleSignIn, isSigningIn } = useUserContext()
  const { openConnectModal } = useConnectModal()

  const [onlineOpen, setOnlineOpen] = useState(false)
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null)

  const { messages, isLoading: msgsLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = useGlobalMessages()
  const { total: onlineTotal } = useOnlineUsers(true)

  const myAddress = userAddress?.toLowerCase()
  const isAuthed = !!userAddress && authStatus === 'authenticated'
  // Animate messages that land live (from a peer) while the chat is open.
  const isNewMessage = useNewMessageGate(messages, GLOBAL_CHAT_ID, !msgsLoading)

  const { scrollRef, handleScroll } = useThreadView({
    messages,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    disableAutoScroll: true,
  })

  const onSignInClick = () => {
    if (!userAddress) {
      openConnectModal?.()
      return
    }
    handleSignIn()
  }

  return (
    <>
      <div className='border-tertiary relative flex h-14.5 items-center justify-between gap-2 border-b-2 px-3'>
        <button
          onClick={() => dispatch(openSidebarToList())}
          className='hover:bg-primary/10 rounded-md p-1 transition-colors'
          aria-label='Back to chats'
        >
          <Image src={ArrowBack} alt='' width={16} height={16} className='rotate-180' />
        </button>
        <div className='flex min-w-0 flex-1 items-center gap-2'>
          <div className='bg-background border-tertiary flex h-9 w-9 shrink-0 items-center justify-center rounded-full border'>
            <Image src={Logo} alt='Grails' width={24} height={24} className='h-6 w-6' />
          </div>
          <p className='text-foreground truncate text-xl font-semibold'>Global Chat</p>
        </div>
        <div className='relative flex items-center gap-1'>
          <button
            onClick={() => setOnlineOpen(true)}
            className='hover:bg-primary/10 flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 transition-colors'
            aria-label='Show online users'
          >
            <span className='h-2 w-2 rounded-full bg-green-500' />
            <span className='text-neutral text-md font-semibold'>{onlineTotal}</span>
          </button>
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
        {msgsLoading ? (
          <div className='flex flex-col gap-1'>
            {['65%', '45%', '55%', '70%', '40%', '60%'].map((width, i) => (
              <GlobalMessageRowSkeleton key={i} showHeader={i % 3 === 0} bodyWidth={width} />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <p className='text-neutral text-md mt-8 text-center'>No messages yet — say hi.</p>
        ) : (
          <div className='flex flex-col gap-1'>
            {isFetchingNextPage && (
              <div className='flex flex-col gap-1'>
                {['65%', '45%', '55%', '70%', '40%', '60%'].map((width, i) => (
                  <GlobalMessageRowSkeleton key={i} showHeader={i % 3 === 0} bodyWidth={width} />
                ))}
              </div>
            )}
            {messages.map((message, i) => {
              const previous = i > 0 ? messages[i - 1] : null
              const current = new Date(message.created_at)
              const startsNewDay = !previous || !isSameDay(current, new Date(previous.created_at))
              const isOwn = !!myAddress && message.sender_address?.toLowerCase() === myAddress
              const menuPosition = i < messages.length - 3 ? 'top' : 'bottom' // show context menu above the latest 3 messages

              return (
                <React.Fragment key={message.id}>
                  {startsNewDay && <DayDivider date={current} />}
                  <GlobalMessageRow
                    menuPosition={menuPosition}
                    message={message}
                    isOwn={isOwn}
                    showHeader={startsNewRun(message, previous)}
                    onReply={setReplyingTo}
                    animate={!isOwn && isNewMessage(message)}
                  />
                </React.Fragment>
              )
            })}
          </div>
        )}
      </div>

      {isAuthed ? (
        <GlobalComposer
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
          onRestoreReply={(message) => setReplyingTo(message)}
        />
      ) : (
        <div className='border-tertiary flex items-center justify-between gap-3 border-t-2 p-3'>
          <p className='text-neutral text-md'>Sign in to chat with the Grails community.</p>
          <PrimaryButton onClick={onSignInClick} disabled={isSigningIn} className='shrink-0'>
            {isSigningIn ? 'Signing in…' : 'Sign in to chat'}
          </PrimaryButton>
        </div>
      )}

      {onlineOpen && <OnlinePanel onClose={() => setOnlineOpen(false)} />}
    </>
  )
}

export default GlobalThreadView
