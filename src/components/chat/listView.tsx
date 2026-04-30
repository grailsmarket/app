'use client'

import React from 'react'
import Image from 'next/image'
import { Cross } from 'ethereum-identity-kit'
import { useAppDispatch } from '@/state/hooks'
import { closeChatSidebar, openSidebarToNew } from '@/state/reducers/chat/sidebar'
import { useChatsInbox } from '@/hooks/chat/useChatsInbox'
import ChatRow from './chatRow'
import PrimaryButton from '@/components/ui/buttons/primary'
import NoResults from '@/components/ui/noResults'
import LoadingCell from '@/components/ui/loadingCell'
import PlusIcon from 'public/icons/plus.svg'

const ListView: React.FC = () => {
  const dispatch = useAppDispatch()
  const { chats, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = useChatsInbox()

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const t = e.currentTarget
    if (t.scrollHeight - t.scrollTop - t.clientHeight < 200 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }

  return (
    <>
      <div className='border-tertiary flex items-center justify-between border-b-2 p-4'>
        <h2 className='font-sedan-sc text-foreground text-2xl'>Messages</h2>
        <button
          onClick={() => dispatch(closeChatSidebar())}
          className='hover:bg-primary/10 rounded-md p-1 transition-colors'
          aria-label='Close'
        >
          <Cross className='text-foreground h-4 w-4 cursor-pointer' />
        </button>
      </div>

      <div className='border-tertiary border-b-2 p-3'>
        <PrimaryButton onClick={() => dispatch(openSidebarToNew())} className='flex w-full items-center justify-center gap-1.5'>
          <Image src={PlusIcon} alt='' width={14} height={14} className='invert' />
          New chat
        </PrimaryButton>
      </div>

      <div onScroll={handleScroll} className='flex-1 overflow-y-auto'>
        {isLoading ? (
          <div className='flex flex-col gap-1 p-3'>
            {Array.from({ length: 6 }).map((_, i) => (
              <LoadingCell key={i} height='64px' width='100%' />
            ))}
          </div>
        ) : chats.length === 0 ? (
          <NoResults label='No chats yet' height='320px' />
        ) : (
          <div className='flex flex-col'>
            {chats.map((chat) => (
              <ChatRow key={chat.id} chat={chat} />
            ))}
            {isFetchingNextPage && (
              <div className='flex flex-col gap-1 p-3'>
                <LoadingCell height='64px' width='100%' />
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

export default ListView
