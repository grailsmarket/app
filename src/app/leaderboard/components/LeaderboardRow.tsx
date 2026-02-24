'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { LeaderboardUser } from '@/types/leaderboard'
import User from '@/components/ui/user'
import Price from '@/components/ui/price'
import { getCategoryDetails } from '@/utils/getCategoryDetails'
import { useWindowSize, useIsClient, FollowButton, ShortArrow } from 'ethereum-identity-kit'
import { useUserContext } from '@/context/user'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { cn } from '@/utils/tailwind'
import { WETH_ADDRESS } from '@/constants/web3/tokens'
import { useClickAway } from '@/hooks/useClickAway'
import { useCategories } from '@/components/filters/hooks/useCategories'

interface LeaderboardRowProps {
  user: LeaderboardUser
  rank: number
  className?: string
}

const MAX_VISIBLE_CATEGORIES = 10

const LeaderboardRow: React.FC<LeaderboardRowProps> = ({ user, rank, className }) => {
  const isClient = useIsClient()
  const { width } = useWindowSize()
  const { categories } = useCategories()
  const { userAddress } = useUserContext()
  const { openConnectModal } = useConnectModal()
  const [isExpanded, setIsExpanded] = useState(false)
  const clickawayMobileRef = useClickAway<HTMLDivElement>(() => setIsExpanded(false))

  const isMobile = isClient && width ? width < 768 : false
  const visibleCategoriesCount =
    isClient && width ? Math.floor(((width / 100) * (isMobile ? 25 : 17)) / 30) : MAX_VISIBLE_CATEGORIES
  const visibleCategories = user.clubs.slice(0, visibleCategoriesCount)
  const remainingCount = user.clubs.length - visibleCategoriesCount

  // Mobile compact category avatars (fewer, smaller)
  const mobileCategoryCount = isClient && width ? Math.floor(((width / 100) * 25) / 28) : 4
  const mobileVisibleCategories = user.clubs.slice(0, mobileCategoryCount)
  const mobileRemainingCount = user.clubs.length - mobileCategoryCount

  // Desktop row (md+)
  const desktopRow = (
    <Link
      href={`/profile/${user.address}`}
      className={cn(
        'group border-tertiary hover:bg-foreground/10 px-sm sm:px-md lg:px-lg hidden h-[60px] w-full flex-row items-center border-b transition md:flex',
        className
      )}
    >
      {/* Rank */}
      <div className='text-neutral xs:min-w-[36px] w-[5%] min-w-[30px] text-center text-base font-medium sm:min-w-[40px]'>
        {rank}
      </div>

      {/* User */}
      <div className='flex w-[25%] flex-row items-center gap-3 lg:w-[20%]'>
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
      <div className='flex w-[12.5%] items-center lg:w-[8%]'>
        <span className='text-base font-medium'>{user.names_owned.toLocaleString()}</span>
      </div>

      {/* Category Names */}
      <div className='flex w-[12.5%] items-center lg:w-[8%]'>
        <span className='text-base font-medium'>{user.names_in_clubs.toLocaleString()}</span>
      </div>

      {/* Listed Names */}
      <div className='flex w-[12.5%] items-center lg:w-[8%]'>
        <span className='text-base font-medium'>{user.names_listed.toLocaleString()}</span>
      </div>

      {/* Sold Names */}
      <div className='hidden w-[8%] items-center lg:flex'>
        <span className='text-base font-medium'>{user.names_sold.toLocaleString()}</span>
      </div>

      {/* Expired */}
      <div className='hidden w-[8%] items-center lg:flex'>
        <span className='text-base font-medium'>{user.expired_names.toLocaleString()}</span>
      </div>

      {/* Sales Vol */}
      <div className='hidden w-[10%] items-center lg:flex'>
        <Price
          price={user.sales_volume}
          currencyAddress={WETH_ADDRESS as `0x${string}`}
          iconSize='14px'
          fontSize='text-base'
        />
      </div>

      {/* Categories */}
      <div className='flex w-[20%] items-center gap-0.5 lg:w-[17%] lg:gap-1'>
        <div className='flex items-center -space-x-1.5'>
          {visibleCategories.map((club) => {
            const categoryDetails = getCategoryDetails(club)
            return (
              <div
                key={club}
                className='border-background relative h-7 w-7 overflow-hidden rounded-full border-2'
                title={club}
              >
                <Image
                  src={categoryDetails.avatar}
                  alt={club}
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

      {/* Follow Button */}
      <div
        className='hidden w-[5%] min-w-[120px] justify-end sm:flex'
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
        }}
      >
        <FollowButton
          lookupAddress={user.address}
          connectedAddress={userAddress}
          onDisconnectedClick={() => openConnectModal?.()}
        />
      </div>
    </Link>
  )

  // Mobile row (< md)
  const mobileRow = (
    <div ref={clickawayMobileRef} className={cn('relative w-full md:hidden', className)}>
      {/* Compact row */}
      <div
        className={cn(
          'border-tertiary px-sm sm:px-md active:bg-foreground/5 flex h-[60px] w-full cursor-pointer flex-row items-center border-b transition',
          isExpanded && 'border-b-0'
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Rank */}
        <div className='text-neutral w-[5%] min-w-[30px] text-center text-lg font-medium'>{rank}</div>

        {/* User */}
        <div className='flex w-[45%] flex-row items-center gap-2'>
          <User
            address={user.address}
            alignTooltip='left'
            wrapperClassName='justify-start max-w-[95%]'
            className='max-w-full px-1 py-1.5'
            loadingCellWidth='100px'
            avatarSize='24px'
            fontSize='14px'
            disableTooltip={true}
          />
        </div>

        {/* Names count */}
        <div className='flex w-[17.5%] items-center justify-center'>
          <span className='text-lg font-semibold'>{user.names_owned.toLocaleString()}</span>
        </div>

        {/* Category avatars */}
        <div className='flex w-[25%] items-center gap-0.5'>
          <div className='flex items-center -space-x-2'>
            {mobileVisibleCategories.map((club) => {
              const categoryDetails = getCategoryDetails(club)
              return (
                <div
                  key={club}
                  className='border-background relative h-6 w-6 overflow-hidden rounded-full border-[1.5px]'
                >
                  <Image
                    src={categoryDetails.avatar}
                    alt={club}
                    width={24}
                    height={24}
                    className='h-full w-full object-cover'
                  />
                </div>
              )
            })}
          </div>
          {mobileRemainingCount > 0 && (
            <span className='text-neutral ml-0.5 text-sm font-medium'>+{mobileRemainingCount}</span>
          )}
          {user.clubs.length === 0 && <span className='text-neutral text-sm'>-</span>}
        </div>

        {/* Expand chevron */}
        <div className='flex w-[5%] items-center justify-end pr-0.5'>
          <ShortArrow
            className={cn('text-neutral h-4 w-4 transition-transform', isExpanded ? 'rotate-0' : 'rotate-180')}
          />
        </div>
      </div>

      {/* Expanded panel */}
      {isExpanded && (
        <div
          className='bg-background border-tertiary absolute top-[60px] right-0 left-0 z-40 rounded-b-lg border-b p-4 pt-3 shadow-md'
          onClick={(e) => e.stopPropagation()}
        >
          {/* Stats grid - 3x2 */}
          <div className='grid grid-cols-3 gap-x-4 gap-y-3'>
            <div>
              <p className='text-neutral text-md'>Names</p>
              <p className='text-lg font-semibold'>{user.names_owned.toLocaleString()}</p>
            </div>
            <div>
              <p className='text-neutral text-md'>Cat Names</p>
              <p className='text-lg font-semibold'>{user.names_in_clubs.toLocaleString()}</p>
            </div>
            <div>
              <p className='text-neutral text-md'>Listed</p>
              <p className='text-lg font-semibold'>{user.names_listed.toLocaleString()}</p>
            </div>
            <div>
              <p className='text-neutral text-md'>Sold</p>
              <p className='text-lg font-semibold'>{user.names_sold.toLocaleString()}</p>
            </div>
            <div>
              <p className='text-neutral text-md'>Expired</p>
              <p className='text-lg font-semibold'>{user.expired_names.toLocaleString()}</p>
            </div>
            <div>
              <p className='text-neutral text-md'>Sales Vol</p>
              <div className='text-lg font-semibold'>
                <Price
                  price={user.sales_volume}
                  currencyAddress={WETH_ADDRESS as `0x${string}`}
                  iconSize='18px'
                  fontSize='text-lg'
                />
              </div>
            </div>
          </div>

          {/* Categories */}
          {user.clubs.length > 0 && (
            <div className='border-tertiary mt-3 border-t pt-3'>
              <p className='text-neutral mb-2 text-lg font-medium'>Categories</p>
              <div className='flex flex-wrap gap-1.5'>
                {user.clubs.map((club) => {
                  const categoryDetails = getCategoryDetails(club)
                  return (
                    <Link
                      href={`/categories/${club}`}
                      key={club}
                      className='bg-secondary flex items-center gap-1 rounded-full p-0.5 pr-2'
                    >
                      <Image
                        src={categoryDetails.avatar}
                        alt={club}
                        width={20}
                        height={20}
                        className='h-5 w-5 rounded-full'
                      />
                      <span className='text-md font-medium'>
                        {categories?.find((c) => c.name === club)?.display_name}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* Actions row */}
          <div className='border-tertiary mt-3 flex items-center justify-between border-t pt-3'>
            <div
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
              }}
            >
              <FollowButton
                lookupAddress={user.address}
                connectedAddress={userAddress}
                onDisconnectedClick={() => openConnectModal?.()}
              />
            </div>
            <Link href={`/profile/${user.address}`} className='text-primary text-xl font-medium hover:underline'>
              View Profile →
            </Link>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <>
      {desktopRow}
      {mobileRow}
    </>
  )
}

export default LeaderboardRow
