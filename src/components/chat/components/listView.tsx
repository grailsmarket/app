'use client'

import React from 'react'
import Image from 'next/image'
import { Cross } from 'ethereum-identity-kit'
import { useAppDispatch } from '@/state/hooks'
import { closeChatSidebar, openSidebarToNew } from '@/state/reducers/chat/sidebar'
import { useChatsInbox } from '@/hooks/chat/useChatsInbox'
import PrimaryButton from '@/components/ui/buttons/primary'
import NoResults from '@/components/ui/noResults'
import LoadingCell from '@/components/ui/loadingCell'
import PlusIcon from 'public/icons/plus.svg'
import ChatRow from './chatRow'

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
      <div className='border-tertiary flex h-14.5 items-center justify-between gap-3 border-b-2 pr-3 pl-4'>
        <h2 className='font-sedan-sc text-foreground text-2xl'>Grails Chat</h2>
        <div className='flex shrink-0 items-center gap-2'>
          <PrimaryButton
            onClick={() => dispatch(openSidebarToNew())}
            className='px-md text-md flex h-7.5! items-center justify-center gap-1'
          >
            <Image src={PlusIcon} alt='add new chat' width={14} height={14} />
            New chat
          </PrimaryButton>
          <button
            onClick={() => dispatch(closeChatSidebar())}
            className='hover:bg-primary/10 rounded-md p-1 transition-colors'
            aria-label='Close'
          >
            <Cross className='text-foreground h-4 w-4 cursor-pointer' />
          </button>
        </div>
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
