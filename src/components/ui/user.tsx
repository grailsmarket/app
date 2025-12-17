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

interface UserProps {
  address: Address
  className?: string
  wrapperClassName?: string
}

const User: React.FC<UserProps> = ({ address, className, wrapperClassName }) => {
  const { userAddress } = useUserContext()
  const { data: profile, isLoading: profileIsLoading } = useQuery({
    queryKey: ['profile', address],
    queryFn: async () => {
      if (!address) return null

      const profile = await fetchAccount(address)
      return profile
    },
  })

  if (profileIsLoading) return <LoadingCell height='32px' width='200px' />

  return (
    <ProfileTooltip
      addressOrName={address}
      connectedAddress={userAddress}
      showStatus={true}
      darkMode={true}
      horizontalOffset={12}
      horizontalPlacement='right'
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
            'bg-tertiary border-primary relative flex h-[37px]! w-fit flex-row items-center gap-2 rounded-sm border px-1.5 py-1 transition hover:opacity-70 sm:h-10',
            className
          )}
        >
          {profile?.ens?.records?.header && (
            <Image
              src={profile?.ens?.records?.header}
              alt='Header'
              width={400}
              height={80}
              className='absolute top-0 left-0 z-0 h-full w-full object-cover opacity-20'
            />
          )}
          <Avatar
            address={address}
            name={profile?.ens?.name}
            src={profile?.ens?.avatar}
            fallback={DEFAULT_FALLBACK_AVATAR}
            style={{ width: '30px', height: '30px', zIndex: 10 }}
          />
          <div className='relative' style={{ maxWidth: 'calc(100% - 38px)' }}>
            <p className='z-10 truncate text-xl font-semibold'>{profile?.ens?.name || truncateAddress(address)}</p>
          </div>
        </Link>
      </div>
    </ProfileTooltip>
  )
}

export default User
