'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { LeaderboardUser } from '@/types/leaderboard'
import User from '@/components/ui/user'
import { getCategoryDetails } from '@/utils/getCategoryDetails'
import { useWindowSize, useIsClient, FollowButton } from 'ethereum-identity-kit'
import { useUserContext } from '@/context/user'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { cn } from '@/utils/tailwind'

interface LeaderboardRowProps {
  user: LeaderboardUser
  rank: number
  className?: string
  hideRows?: string[]
}

const MAX_VISIBLE_CATEGORIES = 10

const LeaderboardRow: React.FC<LeaderboardRowProps> = ({ user, rank, className, hideRows }) => {
  const isClient = useIsClient()
  const { width } = useWindowSize()
  const { userAddress } = useUserContext()
  const { openConnectModal } = useConnectModal()
  const visibleCategoriesCount = isClient && width ? Math.floor(((width / 100) * 20) / 30) : MAX_VISIBLE_CATEGORIES
  const visibleCategories = user.clubs.slice(0, visibleCategoriesCount)
  const remainingCount = user.clubs.length - visibleCategoriesCount

  return (
    <Link
      href={`/profile/${user.address}`}
      className={cn(
        'group border-tertiary hover:bg-foreground/10 px-sm sm:px-md lg:px-lg flex h-[60px] w-full flex-row items-center border-b transition',
        className
      )}
    >
      {/* Rank */}
      <div className='text-neutral xs:min-w-[36px] w-[5%] min-w-[30px] text-center text-lg font-medium sm:min-w-[40px] sm:text-base'>
        {rank}
      </div>

      {/* User */}
      <div className='flex w-[40%] flex-row items-center gap-3 md:w-[25%]'>
        <User
          address={user.address}
          alignTooltip='left'
          wrapperClassName='justify-start max-w-[95%]'
          className='max-w-full px-2 py-1.5'
          loadingCellWidth='140px'
          avatarSize='28px'
          fontSize='15px'
        />
      </div>

      {/* Names Owned */}
      <div
        className={cn(
          'w-[20%] items-center sm:w-[12.5%] lg:w-[10%]',
          hideRows?.includes('names_owned') ? 'hidden' : 'flex'
        )}
      >
        <span className='text-base font-medium'>{user.names_owned.toLocaleString()}</span>
      </div>

      {/* Category Names */}
      <div
        className={cn(
          'w-[12.5%] items-center lg:w-[10%]',
          hideRows?.includes('names_in_clubs') ? 'hidden' : 'hidden md:flex'
        )}
      >
        <span className='text-base font-medium'>{user.names_in_clubs.toLocaleString()}</span>
      </div>

      {/* Listed Names */}
      <div
        className={cn(
          'w-[12.5%] items-center lg:w-[10%]',
          hideRows?.includes('names_listed') ? 'hidden' : 'hidden md:flex'
        )}
      >
        <span className='text-base font-medium'>{user.names_listed.toLocaleString()}</span>
      </div>

      {/* Sold Names */}
      <div className={cn('w-[10%] items-center', hideRows?.includes('names_sold') ? 'hidden' : 'hidden lg:flex')}>
        <span className='text-base font-medium'>{user.names_sold.toLocaleString()}</span>
      </div>

      {/* Expired */}
      <div className={cn('w-[10%] items-center', hideRows?.includes('expired_names') ? 'hidden' : 'hidden lg:flex')}>
        <span className='text-base font-medium'>{user.expired_names.toLocaleString()}</span>
      </div>

      {/* Categories */}
      <div
        className={cn(
          'flex w-[25%] max-w-[27.5%] items-center gap-0.5 sm:w-[27.5%] sm:gap-1 md:w-[20%]',
          hideRows?.includes('clubs') ? 'hidden' : ''
        )}
      >
        <div className='flex items-center -space-x-2 sm:-space-x-1.5'>
          {visibleCategories.map((club) => {
            const categoryDetails = getCategoryDetails(club)
            return (
              <div
                key={club}
                className='border-background relative h-7 w-7 overflow-hidden rounded-full border-2'
                title={categoryDetails.name}
              >
                <Image
                  src={categoryDetails.avatar}
                  alt={categoryDetails.name}
                  width={28}
                  height={28}
                  className='h-full w-full object-cover'
                />
              </div>
            )
          })}
        </div>
        {remainingCount > 0 && <span className='text-neutral text-md ml-1 font-medium'>+{remainingCount}</span>}
        {user.clubs.length === 0 && <span className='text-neutral text-md'>-</span>}
      </div>

      {/* External Link Icon */}
      <div
        className={cn(
          'hidden w-[7.5%] min-w-[120px] justify-end sm:flex sm:w-[5%]',
          hideRows?.includes('follow_button') ? 'hidden' : ''
        )}
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
        }}
      >
        {/* <Image src={ExternalLinkIcon} alt='View profile' width={20} height={20} /> */}
        <FollowButton
          lookupAddress={user.address}
          connectedAddress={userAddress}
          onDisconnectedClick={() => openConnectModal?.()}
        />
      </div>
    </Link>
  )
}

export default LeaderboardRow
