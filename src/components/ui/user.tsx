import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'
import { Address, Avatar, DEFAULT_FALLBACK_AVATAR, fetchAccount, truncateAddress } from 'ethereum-identity-kit'
import { cn } from '@/utils/tailwind'
import LoadingCell from './loadingCell'

interface UserProps {
  address: Address
  className?: string
}

const User: React.FC<UserProps> = ({ address, className }) => {
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
    <Link
      href={`/profile/${address}`}
      className={cn(
        'bg-tertiary border-primary relative flex h-10 max-w-full flex-row items-center gap-2 rounded-sm border px-1.5 py-1 transition hover:opacity-80',
        className
      )}
    >
      {/* @ts-expect-error the records do exist */}
      {profile?.ens?.records?.header && (
        <Image
          // @ts-expect-error the records do exist
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
      <p className='z-10 max-w-full truncate text-xl font-semibold'>{profile?.ens?.name || truncateAddress(address)}</p>
    </Link>
  )
}

export default User
