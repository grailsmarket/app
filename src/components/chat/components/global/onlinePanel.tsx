'use client'

import React from 'react'
import Link from 'next/link'
import { Avatar, Cross } from 'ethereum-identity-kit'
import { useAppDispatch } from '@/state/hooks'
import { closeChatSidebar } from '@/state/reducers/chat/sidebar'
import { useOnlineUsers } from '@/hooks/chat/useOnlineUsers'
import formatTimeAgo from '@/utils/time/formatTimeAgo'
import { formatAddress } from '@/utils/formatAddress'
import LoadingCell from '@/components/ui/loadingCell'
import NoResults from '@/components/ui/noResults'

interface Props {
  onClose: () => void
}

/** Overlay inside the chat sidebar listing users signed in within the last 24h. */
const OnlinePanel: React.FC<Props> = ({ onClose }) => {
  const dispatch = useAppDispatch()
  const { users, total, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = useOnlineUsers(true)

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const t = e.currentTarget
    if (t.scrollHeight - t.scrollTop - t.clientHeight < 200 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }

  return (
    <div className='bg-background absolute inset-0 z-20 flex flex-col'>
      <div className='border-tertiary flex items-center justify-between border-b-2 p-4'>
        <h2 className='font-sedan-sc text-foreground text-2xl'>Online ({total})</h2>
        <button onClick={onClose} className='hover:bg-primary/10 rounded-md p-1 transition-colors' aria-label='Close'>
          <Cross className='text-foreground h-4 w-4 cursor-pointer' />
        </button>
      </div>

      <div onScroll={handleScroll} className='flex-1 overflow-y-auto'>
        {isLoading ? (
          <div className='flex flex-col gap-1 p-3'>
            {Array.from({ length: 8 }).map((_, i) => (
              <LoadingCell key={i} height='56px' width='100%' />
            ))}
          </div>
        ) : users.length === 0 ? (
          <NoResults label='No one online right now' height='320px' />
        ) : (
          <div className='flex flex-col'>
            {users.map((user) => (
              <Link
                key={user.user_id}
                href={`/profile/${user.address}`}
                prefetch={false}
                onClick={() => dispatch(closeChatSidebar())}
                className='border-secondary flex w-full cursor-pointer items-center gap-3 border-b p-3 transition-colors hover:bg-white/5'
              >
                <Avatar
                  key={`${user.address}-online-avatar`}
                  address={user.address}
                  src={user.avatar ?? undefined}
                  name={user.ens_name ?? undefined}
                  style={{ width: '36px', height: '36px' }}
                />
                <div className='min-w-0 flex-1'>
                  <p className='text-foreground truncate text-lg font-semibold'>
                    {user.ens_name ?? formatAddress(user.address)}
                  </p>
                  <p className='text-neutral text-sm'>active {formatTimeAgo(user.last_sign_in)}</p>
                </div>
              </Link>
            ))}
            {isFetchingNextPage && (
              <div className='flex flex-col gap-1 p-3'>
                <LoadingCell height='56px' width='100%' />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default OnlinePanel
