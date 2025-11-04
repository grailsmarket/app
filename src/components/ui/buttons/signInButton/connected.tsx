import React, { useState } from 'react'
import { truncateAddress, Avatar, HeaderImage, ShortArrow } from 'ethereum-identity-kit'
import { useClickAway } from '@/hooks/useClickAway'
import { cn } from '@/utils/tailwind'
import { useUserContext } from '@/context/user'
import { useAppSelector } from '@/state/hooks'
import { selectUserProfile } from '@/state/reducers/portfolio/profile'
import Link from 'next/link'

const Connected = () => {
  const [walletDropdownOpen, setWalletDropdownOpen] = useState(false)
  const dropdownWalletRef = useClickAway<HTMLDivElement>(() => {
    setWalletDropdownOpen(false)
  })

  const { ensProfile } = useAppSelector(selectUserProfile)
  const { profileIsLoading } = useUserContext()
  const { userAddress, handleSignOut } = useUserContext()

  return (
    <div ref={dropdownWalletRef} className='group relative'>
      <button
        onClick={() => setWalletDropdownOpen(!walletDropdownOpen)}
        className='bg-background border-primary p-sm relative flex cursor-pointer items-center gap-2 overflow-hidden rounded-sm border-2 transition-opacity hover:opacity-80'
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
          className='z-10 h-9 w-9 overflow-hidden rounded-sm'
        />
        <div className='z-10 hidden sm:block'>
          {profileIsLoading ? (
            <p>Loading...</p>
          ) : (
            <p className='max-w-[160px] truncate text-xl font-semibold text-nowrap overflow-ellipsis'>
              {ensProfile?.name || truncateAddress(userAddress!)}
            </p>
          )}
        </div>
        <ShortArrow className={cn('z-10 h-5 w-5 rotate-180 transition-transform', walletDropdownOpen && 'rotate-0')} />
      </button>
      <div
        className={cn(
          'bg-secondary p-lg absolute right-0 mt-2 hidden w-40 cursor-pointer flex-col items-end gap-4 rounded-sm font-semibold shadow-md sm:w-full sm:items-start',
          walletDropdownOpen && 'flex'
        )}
      >
        <Link
          href={`/profile/${userAddress}`}
          onClick={() => setWalletDropdownOpen(false)}
          className='flex cursor-pointer items-center gap-2 rounded-sm px-1 transition-opacity hover:opacity-80'
        >
          My Profile
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
