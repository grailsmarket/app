'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { Cross, MagnifyingGlass } from 'ethereum-identity-kit'
import { useAppDispatch } from '@/state/hooks'
import { closeChatSidebar, openSidebarToNew } from '@/state/reducers/chat/sidebar'
import { useChatsInbox } from '@/hooks/chat/useChatsInbox'
import { useChatSearch, MIN_CHAT_SEARCH_LEN } from '@/hooks/chat/useChatSearch'
import { useUserContext } from '@/context/user'
import PrimaryButton from '@/components/ui/buttons/primary'
import NoResults from '@/components/ui/noResults'
import LoadingCell from '@/components/ui/loadingCell'
import PlusIcon from 'public/icons/plus.svg'
import ChatRow from './chatRow'
import GlobalChatRow from './global/globalChatRow'

const ListView: React.FC = () => {
  const dispatch = useAppDispatch()
  const { userAddress, authStatus } = useUserContext()
  const { chats, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = useChatsInbox()

  const [search, setSearch] = useState('')
  // Only switch into search mode once the query is long enough to actually
  // search — below that the normal inbox (Global room + DMs) stays visible.
  const searching = search.trim().length >= MIN_CHAT_SEARCH_LEN
  const { data: searchResults = [], isPending: searchPending } = useChatSearch(search)

  const isAuthed = !!userAddress && authStatus === 'authenticated'

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (searching) return // search results are capped, not infinite-scrolled
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
          {isAuthed && (
            <PrimaryButton
              onClick={() => dispatch(openSidebarToNew())}
              className='px-md text-md flex h-7.5! items-center justify-center gap-1'
            >
              <Image src={PlusIcon} alt='add new chat' width={14} height={14} />
              New chat
            </PrimaryButton>
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

      {isAuthed && (
        <div className='border-tertiary border-b-2 px-3 py-2'>
          <div className='bg-secondary border-tertiary focus-within:border-primary/60 flex items-center gap-2 rounded-md border px-2 transition-colors'>
            <MagnifyingGlass className='text-neutral h-4 w-4 shrink-0' />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Search chats by name or address'
              className='text-foreground placeholder:text-neutral text-md h-8 flex-1 bg-transparent outline-none'
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                aria-label='Clear search'
                className='text-neutral hover:text-foreground shrink-0 cursor-pointer'
              >
                <Cross className='h-3.5 w-3.5' />
              </button>
            )}
          </div>
        </div>
      )}

      <div onScroll={handleScroll} className='flex-1 overflow-y-auto'>
        {searching ? (
          // Search mode (DMs only — global room is excluded).
          searchPending && searchResults.length === 0 ? (
            <div className='flex flex-col gap-1 p-3'>
              {Array.from({ length: 4 }).map((_, i) => (
                <LoadingCell key={i} height='64px' width='100%' />
              ))}
            </div>
          ) : searchResults.length === 0 ? (
            <NoResults label='No chats found' height='320px' />
          ) : (
            <div className='flex flex-col'>
              {searchResults.map((chat) => (
                <ChatRow key={chat.id} chat={chat} />
              ))}
            </div>
          )
        ) : (
          <>
            {/* The global room is pinned above the DM inbox and available to everyone */}
            <GlobalChatRow />
            {!isAuthed ? (
              <p className='text-neutral text-md p-4 text-center'>Sign in to start direct chats</p>
            ) : isLoading ? (
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
          </>
        )}
      </div>
    </>
  )
}

export default ListView
