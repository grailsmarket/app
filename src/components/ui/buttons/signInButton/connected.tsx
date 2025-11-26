import Link from 'next/link'
import Image from 'next/image'
import React, { useState } from 'react'
import { truncateAddress, Avatar, HeaderImage, ShortArrow } from 'ethereum-identity-kit'
import { useClickAway } from '@/hooks/useClickAway'
import { cn } from '@/utils/tailwind'
import { useUserContext } from '@/context/user'
import { useAppSelector } from '@/state/hooks'
import { selectUserProfile } from '@/state/reducers/portfolio/profile'
import GrailsPoap from 'public/art/grails-poap.webp'

const Connected = () => {
  const [walletDropdownOpen, setWalletDropdownOpen] = useState(false)
  const dropdownWalletRef = useClickAway<HTMLDivElement>(() => {
    setWalletDropdownOpen(false)
  })

  const { ensProfile } = useAppSelector(selectUserProfile)
  const { profileIsLoading, userAddress, handleSignOut, setIsSettingsOpen, isPoapClaimed, claimedPoapLink } =
    useUserContext()

  return (
    <div ref={dropdownWalletRef} className='group relative'>
      <button
        onClick={() => setWalletDropdownOpen(!walletDropdownOpen)}
        className='bg-background border-tertiary pr-sm md:p-sm hover:bg-secondary focus:bg-secondary relative flex h-10 cursor-pointer items-center gap-1 overflow-hidden rounded-sm border-2 transition-colors hover:border-white/50 focus:border-white/50 md:h-12 md:gap-2'
      >
        <HeaderImage
          src={ensProfile?.header || ''}
          isLoading={profileIsLoading}
          style={{ position: 'absolute', opacity: 0.2, top: 0, left: 0, width: '100%', height: '100%' }}
        />
        <Avatar
          key={ensProfile?.avatar}
          src={ensProfile?.avatar}
          name={ensProfile?.name}
          className='z-10 h-9 w-9 overflow-hidden rounded-sm md:h-9 md:w-9'
        />
        <div className='z-10 hidden sm:block'>
          {profileIsLoading ? (
            <p>Loading...</p>
          ) : (
            <p className='max-w-[150px] truncate text-xl font-semibold text-nowrap overflow-ellipsis'>
              {ensProfile?.name || truncateAddress(userAddress!)}
            </p>
          )}
        </div>
        <ShortArrow className={cn('z-10 h-5 w-5 rotate-180 transition-transform', walletDropdownOpen && 'rotate-0')} />
      </button>
      <div
        className={cn(
          'bg-secondary p-lg border-tertiary absolute right-0 mt-1 hidden w-40 cursor-pointer flex-col items-end gap-4 rounded-sm border text-lg font-semibold shadow-sm sm:w-full sm:items-start md:text-xl',
          walletDropdownOpen && 'flex'
        )}
      >
        <button
          onClick={() => setIsSettingsOpen(true)}
          className='flex cursor-pointer items-center gap-2 rounded-sm px-1 transition-opacity hover:opacity-80'
        >
          Settings
        </button>
        <Link
          href={`/profile/${userAddress}`}
          onClick={() => setWalletDropdownOpen(false)}
          className='flex cursor-pointer items-center gap-2 rounded-sm px-1 transition-opacity hover:opacity-80'
        >
          My Profile
        </Link>
        {isPoapClaimed && claimedPoapLink ? (
          <Link
            href={claimedPoapLink}
            target='_blank'
            onClick={() => setWalletDropdownOpen(false)}
            className='flex w-full cursor-pointer flex-row-reverse items-center justify-start gap-1.5 rounded-sm px-1 transition-opacity hover:opacity-80 sm:flex-row sm:gap-2'
          >
            <p>My POAP</p>
            <Image src={GrailsPoap} alt='Grails POAP' width={24} height={24} className='h-5 w-auto md:h-6' />
          </Link>
        ) : null}
        <Link
          href={`https://discord.com/invite/ZUyG3mSXFD`}
          target='_blank'
          onClick={() => setWalletDropdownOpen(false)}
          className='flex cursor-pointer items-center gap-2 rounded-sm px-1 transition-opacity hover:opacity-80'
        >
          Discord
        </Link>
        <button
          onClick={() => {
            setWalletDropdownOpen(false)
            handleSignOut()
          }}
          className='flex cursor-pointer items-center gap-2 rounded-sm px-1 text-red-400 transition-opacity hover:opacity-80'
        >
          <p>Sign out</p>
        </button>
      </div>
    </div>
  )
}

export default Connected
