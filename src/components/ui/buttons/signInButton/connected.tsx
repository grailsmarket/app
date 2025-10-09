import { useAccount, useDisconnect } from 'wagmi'
import React, { useState } from 'react'
import { truncateAddress, Avatar, HeaderImage, ShortArrow } from 'ethereum-identity-kit'
import { useAuth } from '@/hooks/useAuthStatus'
import { useClickAway } from '@/hooks/useClickAway'
import { cn } from '@/utils/tailwind'
import { useUserProfile } from '@/hooks/useUserProfile'

const Connected = () => {
  const [walletDropdownOpen, setWalletDropdownOpen] = useState(false)
  const dropdownWalletRef = useClickAway<HTMLDivElement>(() => {
    setWalletDropdownOpen(false)
  })

  const { address } = useAccount()
  const { disconnect } = useDisconnect()
  const { disconnect: disconnectAuth } = useAuth()
  const { profile, profileIsLoading } = useUserProfile()

  return (
    <div ref={dropdownWalletRef} className='group relative'>
      <button
        onClick={() => setWalletDropdownOpen(!walletDropdownOpen)}
        className='bg-background border-primary border-2 p-sm relative flex cursor-pointer items-center gap-2 overflow-hidden rounded-sm transition-opacity hover:opacity-80'
      >
        <Avatar
          key={profile?.ens?.avatar}
          src={profile?.ens?.avatar}
          name={profile?.ens?.name}
          className='z-10 h-9 w-9 overflow-hidden rounded-sm'
        />
        {profileIsLoading ? (
          <p>Loading...</p>
        ) : (
          <p className='z-10 max-w-[160px] truncate text-xl font-semibold text-nowrap overflow-ellipsis'>
            {profile?.ens?.name || truncateAddress(address!)}
          </p>
        )}
        <ShortArrow className={cn('h-5 w-5 rotate-180 transition-transform', walletDropdownOpen && 'rotate-0')} />
        <HeaderImage
          // @ts-expect-error the records do exist
          src={profile?.ens?.records?.header}
          isLoading={profileIsLoading}
          style={{ position: 'absolute', opacity: 0.2, top: 0, left: 0, width: '100%', height: '100%' }}
        />
      </button>
      <div
        className={cn(
          'bg-secondary p-sm absolute right-0 mt-2 hidden w-full cursor-pointer items-center gap-2 rounded-sm shadow-md',
          walletDropdownOpen && 'flex opacity-100'
        )}
      >
        <button
          className='flex cursor-pointer items-center gap-2 rounded-sm px-4 py-2.5 transition-opacity hover:opacity-80'
          onClick={() => {
            disconnectAuth()
            disconnect()
          }}
        >
          <p>Sign out</p>
        </button>
      </div>
    </div>
  )
}

export default Connected
