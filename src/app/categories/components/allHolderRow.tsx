'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'
import { Avatar, DEFAULT_FALLBACK_AVATAR, fetchAccount, truncateAddress } from 'ethereum-identity-kit'
import { beautifyName } from '@/lib/ens'
import { useAppDispatch } from '@/state/hooks'
import { useCategories } from '@/components/filters/hooks/useCategories'
import LoadingCell from '@/components/ui/loadingCell'
import ExternalLinkIcon from 'public/icons/external-link.svg'
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

interface AllHolderRowProps {
  holder: Holder
}

const AllHolderRow: React.FC<AllHolderRowProps> = ({ holder }) => {
  const dispatch = useAppDispatch()
  const { categories } = useCategories()

  const { data: profile, isLoading: profileIsLoading } = useQuery({
    queryKey: ['profile', holder.address],
    queryFn: async () => {
      const profile = await fetchAccount(holder.address)
      return profile
    },
  })

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
      className='group border-tertiary hover:bg-foreground/10 flex h-[60px] w-full flex-row items-center border-b px-4 transition'
    >
      <div className='flex w-[45%] flex-row items-center gap-3'>
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
        {profileIsLoading ? (
          <LoadingCell width='120px' height='20px' />
        ) : (
          <p className='truncate text-base font-semibold'>
            {profile?.ens?.name ? beautifyName(profile.ens.name) : truncateAddress(holder.address)}
          </p>
        )}
      </div>

      <div className='flex w-[50%] items-center gap-1'>
        <p className='text-xl font-medium'>{holder.name_count}</p>
        {/* <span className='text-neutral text-xl'>names</span> */}
      </div>

      <div className='flex w-[5%] justify-end opacity-50 transition-opacity group-hover:opacity-100'>
        <Image src={ExternalLinkIcon} alt='View profile' width={20} height={20} />
      </div>
    </Link>
  )
}

export default AllHolderRow
