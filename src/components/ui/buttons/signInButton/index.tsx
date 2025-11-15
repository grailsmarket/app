'use client'

import React from 'react'
import { useAccount } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { EthereumIcon, LoadingCell } from 'ethereum-identity-kit'
import Connected from './connected'
import { useUserContext } from '@/context/user'
import PrimaryButton from '../primary'

const SignInButton = () => {
  const { address } = useAccount()
  const { openConnectModal } = useConnectModal()
  const { authStatus, isSigningIn } = useUserContext()

  if (authStatus === 'authenticated' && address) return <Connected />

  return address && authStatus === 'loading' ? (
    <LoadingCell style={{ width: '200px', height: '44px' }} />
  ) : (
    <PrimaryButton
      onClick={() => openConnectModal?.()}
      disabled={isSigningIn}
      className='px-md sm:px-lg flex flex-row items-center gap-1.5'
    >
      <EthereumIcon className='h-4 w-4 md:h-5 md:w-5' />
      <p className='font-sedan-sc text-lg font-medium md:text-xl'>{isSigningIn ? 'Signing In...' : 'Sign In'}</p>
    </PrimaryButton>
  )
}

export default SignInButton
