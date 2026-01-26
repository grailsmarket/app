'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'
import { Avatar, DEFAULT_FALLBACK_AVATAR, fetchAccount, truncateAddress } from 'ethereum-identity-kit'
import { beautifyName } from '@/lib/ens'
import { cn } from '@/utils/tailwind'
import { useAppDispatch } from '@/state/hooks'
import LoadingCell from '@/components/ui/loadingCell'
import ExternalLinkIcon from 'public/icons/external-link.svg'
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

interface HolderRowProps {
  holder: Holder
  category: string
  index: number
}

const HolderRow: React.FC<HolderRowProps> = ({ holder, category, index }) => {
  const dispatch = useAppDispatch()

  const { data: profile, isLoading: profileIsLoading } = useQuery({
    queryKey: ['profile', holder.address],
    queryFn: async () => {
      const profile = await fetchAccount(holder.address)
      return profile
    },
  })

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
      className={cn(
        'group border-tertiary hover:bg-foreground/10 flex h-[60px] w-full flex-row items-center gap-3 border-b px-4 transition',
        index === 0 && 'border-t'
      )}
    >
      {/* Avatar */}
      <div className='flex-shrink-0'>
        {profileIsLoading ? (
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
      </div>

      {/* Name/Address */}
      <div className='flex min-w-0 flex-1 flex-col'>
        {profileIsLoading ? (
          <LoadingCell width='120px' height='20px' />
        ) : (
          <p className='truncate text-base font-semibold'>
            {profile?.ens?.name ? beautifyName(profile.ens.name) : truncateAddress(holder.address)}
          </p>
        )}
      </div>

      {/* Name Count */}
      <div className='flex flex-shrink-0 items-center gap-1'>
        <span className='text-xl font-medium'>{holder.name_count}</span>
        <span className='text-neutral text-xl'>names</span>
      </div>

      {/* Link Icon */}
      <div className='flex-shrink-0 opacity-50 transition-opacity group-hover:opacity-100'>
        <Image src={ExternalLinkIcon} alt='View profile' width={20} height={20} />
      </div>
    </Link>
  )
}

export default HolderRow
