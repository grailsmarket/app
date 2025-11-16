'use client'

import React from 'react'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { EthereumIcon, LoadingCell, useWindowSize } from 'ethereum-identity-kit'
import Connected from './connected'
import { useUserContext } from '@/context/user'
import PrimaryButton from '../primary'

const SignInButton = () => {
  const { width } = useWindowSize()
  const { openConnectModal } = useConnectModal()
  const { userAddress, authStatus, isSigningIn, authStatusIsRefetching, authStatusIsLoading } = useUserContext()

  if (userAddress && authStatus === 'authenticated') return <Connected />

  const isAuthloading = authStatus === 'loading' || authStatusIsLoading || authStatusIsRefetching

  return userAddress && isAuthloading ? (
    <LoadingCell style={{ width: width && width < 768 ? '80px' : '180px', height: '44px' }} />
  ) : (
    <PrimaryButton
      onClick={() => openConnectModal?.()}
      disabled={isSigningIn}
      className='px-md sm:px-lg flex flex-row items-center gap-2'
    >
      <EthereumIcon className='h-4 w-3! md:h-5' />
      <p className='font-sedan-sc text-lg font-medium md:text-xl'>{isSigningIn ? 'Signing In...' : 'Sign In'}</p>
    </PrimaryButton>
  )
}

export default SignInButton
