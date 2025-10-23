'use client'

import React from 'react'
import { useAccount } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { EthereumIcon, LoadingCell } from 'ethereum-identity-kit'
import Connected from './connected'
import { useUserContext } from '@/context/user'

const SignInButton = () => {
  const { address } = useAccount()
  const { openConnectModal } = useConnectModal()
  const { authStatus, isSigningIn } = useUserContext()

  if (authStatus === 'authenticated' && address) return <Connected />

  return address && authStatus === 'loading' ? (
    <LoadingCell style={{ width: '200px', height: '44px' }} />
  ) : (
    <button
      onClick={() => openConnectModal?.()}
      disabled={isSigningIn}
      className='bg-primary text-background flex cursor-pointer items-center gap-2 rounded-sm px-4 py-2.5 transition-opacity hover:opacity-80 disabled:opacity-50'
    >
      <EthereumIcon className='h-5 w-5' />
      <p className='font-sedan-sc text-xl font-medium'>{isSigningIn ? 'Signing In...' : 'Sign In'}</p>
    </button>
  )
}

export default SignInButton
