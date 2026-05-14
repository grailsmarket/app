import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
import { ENS_METADATA_URL } from '@/constants/ens'

interface UserProps {
  address: Address
  className?: string
  wrapperClassName?: string
  loadingCellWidth?: string
  avatarSize?: string
  fontSize?: string
  alignTooltip?: 'left' | 'right'
  disableTooltip?: boolean
  disableLink?: boolean
  hideHeaderImage?: boolean
}

const User: React.FC<UserProps> = ({
  address,
  className,
  wrapperClassName,
  loadingCellWidth = '60%',
  avatarSize = '18px',
  fontSize = '15px',
  alignTooltip = 'right',
  disableTooltip = false,
  disableLink = false,
  hideHeaderImage = false,
}) => {
  const router = useRouter()
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
  const avatarSrc = `${ENS_METADATA_URL}/mainnet/avatar/${profile?.ens?.name}`
  const headerImageSrc = `${ENS_METADATA_URL}/mainnet/header/${profile?.ens?.name}`

  return (
    <TooltipWrapper
      address={address}
      userAddress={userAddress}
      alignTooltip={alignTooltip}
      disableTooltip={disableTooltip}
    >
      <div className={cn('flex justify-end', wrapperClassName)}>
        {disableLink ? (
          <div
            className={cn(
              'bg-tertiary relative flex w-fit cursor-pointer flex-row items-center gap-1.5 rounded-sm px-1 py-0.5 transition hover:opacity-70',
              className
            )}
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              router.push(`/profile/${address}`)
            }}
          >
            {(!hideHeaderImage && headerImageSrc) && (
              <Image
                src={headerImageSrc}
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
              src={avatarSrc}
              fallback={DEFAULT_FALLBACK_AVATAR}
              style={{ width: avatarSize, minWidth: avatarSize, height: avatarSize, minHeight: avatarSize, zIndex: 10 }}
            />
            <div className='relative w-full' style={{ maxWidth: `calc(100% - ${parseInt(avatarSize) + 6}px)` }}>
              <p className='z-10 truncate text-[15px] font-semibold' style={{ fontSize: fontSize }}>
                {profile?.ens?.name ? beautifyName(profile?.ens?.name) : truncateAddress(address)}
              </p>
            </div>
          </div>
        ) : (
          <Link
            href={`/profile/${address}`}
            className={cn(
              'bg-tertiary relative flex w-fit flex-row items-center gap-1.5 rounded-sm px-1 py-0.5 transition hover:opacity-70',
              className,
              disableTooltip && 'pointer-events-none'
            )}
          >
            {(!hideHeaderImage && headerImageSrc) && (
              <Image
                src={headerImageSrc}
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
              style={{ width: avatarSize, minWidth: avatarSize, height: avatarSize, minHeight: avatarSize, zIndex: 10 }}
            />
            <div className='relative w-full' style={{ maxWidth: `calc(100% - ${parseInt(avatarSize) + 6}px)` }}>
              <p className='z-10 truncate text-[15px] font-semibold' style={{ fontSize: fontSize }}>
                {profile?.ens?.name ? beautifyName(profile?.ens?.name) : truncateAddress(address)}
              </p>
            </div>
          </Link>
        )}
      </div>
    </TooltipWrapper>
  )
}

interface TooltipWrapperProps {
  children: React.ReactNode
  address: Address
  userAddress?: Address
  alignTooltip?: 'left' | 'right'
  disableTooltip?: boolean
}

const TooltipWrapper: React.FC<TooltipWrapperProps> = ({
  children,
  address,
  userAddress,
  alignTooltip,
  disableTooltip,
}) => {
  if (disableTooltip) return children
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
      {children as React.ReactElement}
    </ProfileTooltip>
  )
}

export default User
