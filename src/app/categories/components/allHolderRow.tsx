'use client'

import React from 'react'
import Link from 'next/link'
import { useAppDispatch } from '@/state/hooks'
import { useCategories } from '@/components/filters/hooks/useCategories'
import type { Holder } from '@/api/holders'
import { addCategories, clearFilters as clearDomainsFilters } from '@/state/reducers/filters/profileDomainsFilters'
import { clearActivityFilters } from '@/state/reducers/filters/profileActivityFilters'
import { clearReceivedOffersFilters } from '@/state/reducers/filters/receivedOffersFilters'
import { clearMyOffersFilters } from '@/state/reducers/filters/myOffersFilters'
import { clearWatchlistFilters } from '@/state/reducers/filters/watchlistFilters'
import { clearFilters as clearListingsFilters } from '@/state/reducers/filters/profileListingsFilter'
import { clearFilters as clearGraceFilters } from '@/state/reducers/filters/profileGraceFilters'
import { clearFilters as clearExpiredFilters } from '@/state/reducers/filters/profileExpiredFilters'
import { setLastVisitedProfile } from '@/state/reducers/portfolio/profile'
import User from '@/components/ui/user'
import { useUserContext } from '@/context/user'
import { FollowButton } from 'ethereum-identity-kit'
import { useConnectModal } from '@rainbow-me/rainbowkit'

interface AllHolderRowProps {
  holder: Holder
  rank: number
}

const AllHolderRow: React.FC<AllHolderRowProps> = ({ holder, rank }) => {
  const dispatch = useAppDispatch()
  const { openConnectModal } = useConnectModal()
  const { categories } = useCategories()
  const { userAddress } = useUserContext()

  const handleClick = () => {
    if (categories) {
      dispatch(setLastVisitedProfile(null))
      dispatch(clearDomainsFilters())
      dispatch(clearListingsFilters())
      dispatch(clearMyOffersFilters())
      dispatch(clearReceivedOffersFilters())
      dispatch(clearWatchlistFilters())
      dispatch(clearActivityFilters())
      dispatch(clearGraceFilters())
      dispatch(clearExpiredFilters())

      const allCategoryNames = categories.map((cat) => cat.name)
      dispatch(addCategories(allCategoryNames))
    }
  }

  return (
    <Link
      href={`/profile/${holder.address}`}
      onClick={handleClick}
      className='group border-tertiary hover:bg-foreground/10 px-sm sm:px-md lg:px-lg flex h-[60px] w-full flex-row items-center border-b transition'
    >
      <p className='text-neutral w-[38px] text-center text-lg font-semibold sm:w-[48px] sm:text-xl'>{rank}</p>
      <div className='flex w-[65%] min-w-[40%] flex-row items-center gap-3 sm:w-[55%] lg:w-[45%]'>
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
        <p className='text-xl font-medium'>{holder.name_count}</p>
        {/* <span className='text-neutral text-xl'>names</span> */}
      </div>

      <div
        className='flex w-[10%] min-w-[120px] justify-end lg:w-[5%]'
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
        }}
      >
        <FollowButton
          lookupAddress={holder.address}
          connectedAddress={userAddress}
          onDisconnectedClick={() => openConnectModal?.()}
        />
      </div>
    </Link>
  )
}

export default AllHolderRow
