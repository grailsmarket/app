'use client'

import { useAccount, useDisconnect } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import React, { useCallback, useEffect, useState } from 'react'
import { EthereumIcon, useSiwe, LoadingCell } from 'ethereum-identity-kit'
import { useAuth } from '@/hooks/useAuthStatus'
import { fetchNonce } from '@/api/siwe/fetchNonce'
import { DAY_IN_SECONDS } from '@/constants/time'
import Connected from './connected'
import { queryClient } from '@/lib/queryClient'

const SignInButton = () => {
  const [isSigningIn, setIsSigningIn] = useState(false)
  const { address } = useAccount()
  const { openConnectModal } = useConnectModal()
  const { disconnect } = useDisconnect()
  const { authStatus, verify, refetchAuthStatus } = useAuth()

  const handleGetNonce = useCallback(async () => {
    if (!address) throw new Error('No address found')
    return await fetchNonce(address)
  }, [address])

  const handleSignInSuccess = async () => {
    queryClient.invalidateQueries({ queryKey: ['auth', 'status'] })
    setIsSigningIn(false)
    refetchAuthStatus()
  }

  const handleSignInError = (error: Error) => {
    console.error('Sign in error:', error)
    setIsSigningIn(false)
    disconnect()
  }

  const { handleSignIn } = useSiwe({
    verifySignature: verify,
    onSignInSuccess: handleSignInSuccess,
    onSignInError: handleSignInError,
    message: 'Grails Market wants you to sign in',
    getNonce: handleGetNonce,
    expirationTime: DAY_IN_SECONDS * 1000, // day in milliseconds
  })

  useEffect(() => {
    if (address && authStatus === 'unauthenticated') {
      setIsSigningIn(true)
      handleSignIn()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, authStatus])

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
