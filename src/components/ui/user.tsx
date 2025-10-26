import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'
import { Address, Avatar, DEFAULT_FALLBACK_AVATAR, fetchAccount, truncateAddress } from 'ethereum-identity-kit'
import LoadingCell from './loadingCell'

interface UserProps {
  address: Address
}

const User: React.FC<UserProps> = ({ address }) => {
  const {
    data: profile,
    isLoading: profileIsLoading,
  } = useQuery({
    queryKey: ['profile', address],
    queryFn: async () => {
      if (!address) return null

      const profile = await fetchAccount(address)
      return profile
    },
  })

  if (profileIsLoading) return <LoadingCell height='32px' width='200px' />

  return (
    <Link href={`/profile/${address}`} className='flex max-w-full flex-row bg-tertiary relative items-center gap-2 rounded-sm border-[1px] border-primary py-1 px-1.5'>
      {/* @ts-expect-error the records do exist */}
      {profile?.ens?.records?.header && <Image
        // @ts-expect-error the records do exist
        src={profile?.ens?.records?.header}
        alt='Header'
        width={24}
        height={24}
        className='absolute top-0 left-0 w-full h-full object-cover z-0 opacity-20'
      />}
      <Avatar
        address={address}
        name={profile?.ens?.name}
        src={profile?.ens?.avatar}
        fallback={DEFAULT_FALLBACK_AVATAR}
        style={{ width: '24px', height: '24px', zIndex: 10 }}
      />
      <p className='text-xl z-10 font-medium max-w-full truncate'>{profile?.ens?.name || truncateAddress(address)}</p>
    </Link>
  )
}

export default User
