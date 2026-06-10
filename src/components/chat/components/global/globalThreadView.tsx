'use client'

import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { isSameDay, differenceInMinutes } from 'date-fns'
import { Cross } from 'ethereum-identity-kit'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useAppDispatch } from '@/state/hooks'
import { closeChatSidebar, openSidebarToList } from '@/state/reducers/chat/sidebar'
import { useGlobalMessages } from '@/hooks/chat/useGlobalMessages'
import { useOnlineUsers } from '@/hooks/chat/useOnlineUsers'
import { useUserContext } from '@/context/user'
import LoadingCell from '@/components/ui/loadingCell'
import PrimaryButton from '@/components/ui/buttons/primary'
import GlobalMessageRow from './globalMessageRow'
import GlobalComposer from './globalComposer'
import OnlinePanel from './onlinePanel'
import DayDivider from '../chat/dayDivider'
import ArrowBack from 'public/icons/arrow-back.svg'
import Logo from 'public/logo.svg'
import type { ChatMessage } from '@/types/chat'

const SENDER_RUN_GAP_MINUTES = 5

/** Avatar + sender header renders when the sender run breaks: new sender, >5 min gap, or new day. */
const startsNewRun = (message: ChatMessage, previous: ChatMessage | null): boolean => {
  if (!previous) return true
  if (previous.sender_address?.toLowerCase() !== message.sender_address?.toLowerCase()) return true
  const current = new Date(message.created_at)
  const prev = new Date(previous.created_at)
  if (!isSameDay(current, prev)) return true
  return differenceInMinutes(current, prev) > SENDER_RUN_GAP_MINUTES
}

const GlobalThreadView: React.FC = () => {
  const dispatch = useAppDispatch()
  const { userAddress, authStatus, handleSignIn, isSigningIn } = useUserContext()
  const { openConnectModal } = useConnectModal()
  const [onlineOpen, setOnlineOpen] = useState(false)

  const { messages, isLoading: msgsLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = useGlobalMessages()
  const { total: onlineTotal } = useOnlineUsers(true)

  const myAddress = userAddress?.toLowerCase()
  const isAuthed = !!userAddress && authStatus === 'authenticated'

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

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const t = e.currentTarget
    if (t.scrollTop < 200 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }

  const onSignInClick = () => {
    if (!userAddress) {
      openConnectModal?.()
      return
    }
    handleSignIn()
  }

  return (
    <>
      <div className='border-tertiary relative flex items-center justify-between gap-2 border-b-2 p-3'>
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
          <p className='text-foreground truncate text-xl font-semibold'>Grails Chat</p>
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
          <div className='flex flex-col gap-2'>
            {Array.from({ length: 6 }).map((_, i) => (
              <LoadingCell key={i} height='32px' width={i % 2 === 0 ? '60%' : '50%'} />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <p className='text-neutral text-md mt-8 text-center'>No messages yet — say hi.</p>
        ) : (
          <div className='flex flex-col gap-1'>
            {isFetchingNextPage && (
              <div className='py-2 text-center'>
                <span className='text-neutral text-sm'>Loading older messages…</span>
              </div>
            )}
            {messages.map((m, i) => {
              const previous = i > 0 ? messages[i - 1] : null
              const current = new Date(m.created_at)
              const startsNewDay = !previous || !isSameDay(current, new Date(previous.created_at))
              return (
                <React.Fragment key={m.id}>
                  {startsNewDay && <DayDivider date={current} />}
                  <GlobalMessageRow
                    message={m}
                    isOwn={!!myAddress && m.sender_address?.toLowerCase() === myAddress}
                    showHeader={startsNewRun(m, previous)}
                  />
                </React.Fragment>
              )
            })}
          </div>
        )}
      </div>

      {isAuthed ? (
        <GlobalComposer />
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
