'use client'

import React, { useState } from 'react'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useUserContext } from '@/context/user'
import { SignInButton as SignInButtonComponent } from 'ethereum-identity-kit'
import { DAY_IN_SECONDS } from '@/constants/time'
import { useClickAway } from '@/hooks/useClickAway'
import { cn } from '@/utils/tailwind'
import Image from 'next/image'
import ExternalLink from 'public/icons/external-link.svg'
import GrailsPoap2025 from 'public/art/grails-poap-2025.webp'
import GrailsPoap2026 from 'public/art/grails-poap-2026.webp'
import Link from 'next/link'

const SignInButton = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownWalletRef = useClickAway<HTMLDivElement>(() => {
    setIsDropdownOpen(false)
  })

  const { openConnectModal } = useConnectModal()
  const {
    userAddress,
    authStatus,
    isPoapClaimed,
    claimedPoapLink,
    poapClaimedYear,
    setIsSettingsOpen,
    handleSignOut,
    handleGetNonce,
    verify,
    handleSignInSuccess,
    handleSignInError,
  } = useUserContext()

  return (
    <div
      ref={dropdownWalletRef}
      className={cn(
        'group relative',
        userAddress && authStatus === 'authenticated' ? 'text-foreground' : 'text-background'
      )}
    >
      <SignInButtonComponent
        autoSignInAfterConnection={true}
        getNonce={handleGetNonce}
        verifySignature={verify}
        onSignInSuccess={handleSignInSuccess}
        onSignInError={handleSignInError}
        message='Grails Market wants you to sign in'
        onDisconnectedClick={() => openConnectModal?.()}
        darkMode={true}
        isSignedIn={userAddress && authStatus === 'authenticated'}
        isDropdown={true}
        isDropdownOpen={isDropdownOpen}
        onSignedInClick={() => {
          setIsDropdownOpen(!isDropdownOpen)
        }}
        expirationTime={DAY_IN_SECONDS * 1000}
      />
      <div
        className={cn(
          'bg-secondary p-lg border-tertiary text-foreground absolute right-0 mt-1 hidden w-40 cursor-pointer flex-col items-end gap-4 rounded-sm border text-lg font-semibold shadow-sm sm:w-full sm:items-start md:text-xl',
          isDropdownOpen && 'flex'
        )}
      >
        <button
          onClick={() => setIsSettingsOpen(true)}
          className='flex cursor-pointer items-center gap-2 rounded-sm px-1 transition-opacity hover:opacity-80'
        >
          Settings
        </button>
        <button
          onClick={() => window.open(`https://revoke.cash/address/${userAddress}?chainId=1`, '_blank')}
          className='flex cursor-pointer items-center gap-2 rounded-sm px-1 transition-opacity hover:opacity-80'
        >
          <p className='text-lg text-nowrap sm:text-xl'>My Approvals</p>
          <Image src={ExternalLink} alt='External Link' width={20} height={20} className='h-5 w-auto' />
        </button>
        {isPoapClaimed && claimedPoapLink ? (
          <Link
            href={claimedPoapLink}
            target='_blank'
            onClick={() => setIsDropdownOpen(false)}
            className='flex w-full cursor-pointer flex-row-reverse items-center justify-start gap-1.5 rounded-sm px-1 transition-opacity hover:opacity-80 sm:flex-row sm:gap-2'
          >
            <p>My POAP</p>
            <Image
              src={poapClaimedYear === '2026' ? GrailsPoap2026 : GrailsPoap2025}
              alt='Grails POAP'
              width={24}
              height={24}
              className='h-5 w-auto md:h-6'
            />
          </Link>
        ) : null}
        <button
          onClick={() => {
            setIsDropdownOpen(false)
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

export default SignInButton
