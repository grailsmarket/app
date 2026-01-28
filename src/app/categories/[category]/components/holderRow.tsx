'use client'

import React from 'react'
import Link from 'next/link'
import { useAppDispatch } from '@/state/hooks'
import type { Holder } from '@/api/holders'
import { setLastVisitedProfile } from '@/state/reducers/portfolio/profile'
import { clearActivityFilters } from '@/state/reducers/filters/profileActivityFilters'
import { clearReceivedOffersFilters } from '@/state/reducers/filters/receivedOffersFilters'
import { clearMyOffersFilters } from '@/state/reducers/filters/myOffersFilters'
import { clearWatchlistFilters } from '@/state/reducers/filters/watchlistFilters'
import { clearFilters as clearListingsFilters } from '@/state/reducers/filters/profileListingsFilter'
import { clearFilters as clearGraceFilters } from '@/state/reducers/filters/profileGraceFilters'
import { clearFilters as clearExpiredFilters } from '@/state/reducers/filters/profileExpiredFilters'
import {
  clearFilters as clearDomainsFilters,
  setFiltersCategory as setProfileDomainsFiltersCategory,
} from '@/state/reducers/filters/profileDomainsFilters'
import User from '@/components/ui/user'
import { FollowButton } from 'ethereum-identity-kit'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useUserContext } from '@/context/user'

interface HolderRowProps {
  holder: Holder
  category: string
  rank: number
}

const HolderRow: React.FC<HolderRowProps> = ({ holder, category, rank }) => {
  const dispatch = useAppDispatch()
  const { openConnectModal } = useConnectModal()
  const { userAddress } = useUserContext()

  const handleClick = () => {
    dispatch(setLastVisitedProfile(null))
    dispatch(clearDomainsFilters())
    dispatch(clearListingsFilters())
    dispatch(clearMyOffersFilters())
    dispatch(clearReceivedOffersFilters())
    dispatch(clearWatchlistFilters())
    dispatch(clearActivityFilters())
    dispatch(clearGraceFilters())
    dispatch(clearExpiredFilters())
    dispatch(setProfileDomainsFiltersCategory(category))
  }

  return (
    <Link
      href={`/profile/${holder.address}`}
      onClick={handleClick}
      className='group border-tertiary hover:bg-foreground/10 px-md lg:px-lg flex h-[60px] w-full flex-row items-center border-b transition'
    >
      <p className='text-neutral w-[30px] text-center text-lg font-semibold sm:w-[48px] sm:text-xl'>{rank}</p>
      <div className='flex w-[55%] min-w-[40%] flex-row items-center gap-3 sm:w-[55%] lg:w-[45%]'>
        {/* {profileIsLoading ? (
          <LoadingCell width='40px' height='40px' radius='50%' />
        ) : (
          <Avatar
            address={holder.address}
            name={profile?.ens?.name}
            src={profile?.ens?.avatar}
            fallback={DEFAULT_FALLBACK_AVATAR}
            style={{ width: '40px', height: '40px' }}
          />
        )}
        {profileIsLoading ? (
          <LoadingCell width='120px' height='20px' />
        ) : (
          <p className='truncate text-base font-semibold'>
            {profile?.ens?.name ? beautifyName(profile.ens.name) : truncateAddress(holder.address)}
          </p>
        )} */}
        <User
          address={holder.address}
          alignTooltip='left'
          wrapperClassName='justify-start max-w-[95%]'
          className='max-w-full px-2 py-1.5'
          loadingCellWidth='140px'
          avatarSize='28px'
          fontSize='15px'
        />
      </div>

      <div className='flex w-[25%] items-center gap-1 sm:w-[35%] lg:w-[50%]'>
        <span className='text-xl font-medium'>{holder.name_count}</span>
        {/* <span className='text-neutral text-xl'>names</span> */}
      </div>

      <div
        className='flex w-[10%] min-w-[120px] justify-end lg:w-[5%]'
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
        }}
      >
        {/* <Image src={ExternalLinkIcon} alt='View profile' width={20} height={20} /> */}
        <FollowButton
          lookupAddress={holder.address}
          connectedAddress={userAddress}
          onDisconnectedClick={() => openConnectModal?.()}
        />
      </div>
    </Link>
  )
}

export default HolderRow
