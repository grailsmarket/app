import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'
import {
  Address,
  Avatar,
  DEFAULT_FALLBACK_AVATAR,
  fetchAccount,
  ProfileTooltip,
  truncateAddress,
} from 'ethereum-identity-kit'
import { cn } from '@/utils/tailwind'
import LoadingCell from './loadingCell'
import { useUserContext } from '@/context/user'
import { beautifyName } from '@/lib/ens'

interface UserProps {
  address: Address
  className?: string
  wrapperClassName?: string
  loadingCellWidth?: string
  avatarSize?: string
  fontSize?: string
  alignTooltip?: 'left' | 'right'
}

const User: React.FC<UserProps> = ({
  address,
  className,
  wrapperClassName,
  loadingCellWidth = '60%',
  avatarSize = '18px',
  fontSize = '15px',
  alignTooltip = 'right',
}) => {
  const { userAddress } = useUserContext()
  const { data: profile, isLoading: profileIsLoading } = useQuery({
    queryKey: ['profile', address],
    queryFn: async () => {
      if (!address) return null

      const profile = await fetchAccount(address)
      return profile
    },
  })

  if (profileIsLoading) return <LoadingCell height='28px' width={loadingCellWidth} />

  return (
    <ProfileTooltip
      addressOrName={address}
      connectedAddress={userAddress}
      showStatus={true}
      darkMode={true}
      horizontalOffset={12}
      horizontalPlacement={alignTooltip || 'right'}
      verticalPlacement='auto'
      boundary='scrollParent'
      keepTooltipOnHover={true}
      showFollowButton={true}
      showDelay={750}
    >
      <div className={cn('flex justify-end', wrapperClassName)}>
        <Link
          href={`/profile/${address}`}
          className={cn(
            'bg-tertiary relative flex w-fit flex-row items-center gap-1.5 rounded-sm px-1 py-0.5 transition hover:opacity-70',
            className
          )}
        >
          {profile?.ens?.records?.header && (
            <Image
              src={profile?.ens?.records?.header}
              alt='Header'
              width={400}
              height={80}
              unoptimized={true}
              className='absolute top-0 left-0 z-0 h-full w-full object-cover opacity-20'
            />
          )}
          <Avatar
            address={address}
            name={profile?.ens?.name}
            src={profile?.ens?.avatar}
            fallback={DEFAULT_FALLBACK_AVATAR}
            style={{ width: avatarSize, height: avatarSize, zIndex: 10 }}
          />
          <div className='relative w-full' style={{ maxWidth: `calc(100% - ${parseInt(avatarSize) + 6}px)` }}>
            <p className='z-10 truncate text-[15px] font-semibold' style={{ fontSize: fontSize }}>
              {profile?.ens?.name ? beautifyName(profile?.ens?.name) : truncateAddress(address)}
            </p>
          </div>
        </Link>
      </div>
    </ProfileTooltip>
  )
}

export default User
