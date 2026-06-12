'use client'

import React from 'react'
import Link from 'next/link'
import { Avatar, Cross } from 'ethereum-identity-kit'
import { useOnlineUsers } from '@/hooks/chat/useOnlineUsers'
import { usePeerProfile } from '@/hooks/chat/usePeerProfile'
import formatTimeAgo from '@/utils/time/formatTimeAgo'
import { formatAddress } from '@/utils/formatAddress'
import LoadingCell from '@/components/ui/loadingCell'
import NoResults from '@/components/ui/noResults'
import type { OnlineUser } from '@/types/chat'
import Label from '@/components/ui/label'

interface Props {
  onClose: () => void
}

const OnlineUserRow: React.FC<{ user: OnlineUser }> = ({ user }) => {
  // Identity (primary name + avatar) resolves client-side from the address,
  // same as DM chats — the backend only ships addresses.
  const profile = usePeerProfile(user.address)
  const lastActive = user.last_active ?? user.last_sign_in

  return (
    <Link
      href={`/profile/${user.address}`}
      prefetch={false}
      className='border-secondary flex w-full cursor-pointer items-center gap-3 border-b p-3 transition-colors hover:bg-white/5'
    >
      <Avatar
        key={`${user.address}-online-avatar`}
        address={user.address}
        src={profile?.avatar ?? undefined}
        name={profile?.ensName ?? undefined}
        style={{ width: '36px', height: '36px' }}
      />
      <div className='flex min-w-0 flex-1 flex-col gap-px'>
        <p className='text-foreground truncate text-lg font-semibold'>
          {profile?.displayLabel ?? formatAddress(user.address)}
        </p>
        <p className='text-neutral text-md'>{lastActive ? `active ${formatTimeAgo(lastActive)}` : 'recently active'}</p>
      </div>
    </Link>
  )
}

/** Overlay inside the chat sidebar listing users active within the last 24h. */
const OnlinePanel: React.FC<Props> = ({ onClose }) => {
  const { users, total, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = useOnlineUsers(true)

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const t = e.currentTarget
    if (t.scrollHeight - t.scrollTop - t.clientHeight < 200 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }

  return (
    <div className='bg-background absolute inset-0 z-20 flex flex-col'>
      <div className='border-tertiary flex h-14.5 items-center justify-between border-b-2 px-4'>
        <div className='flex items-center gap-2'>
          <h2 className='font-sedan-sc text-foreground text-2xl'>Online</h2>
          <Label label={total} className='bg-foreground/80 text-background mt-px' />
        </div>
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
              <OnlineUserRow key={user.user_id} user={user} />
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
