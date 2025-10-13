'use client'

import { useAccount } from 'wagmi'
import type { Address } from 'viem'
import { useContext, createContext, useEffect, useCallback, useState } from 'react'
import { useSiwe } from 'ethereum-identity-kit'
import { DAY_IN_SECONDS } from '@/constants/time'
import { queryClient } from '@/lib/queryClient'
import { fetchNonce } from '@/api/siwe/fetchNonce'
import { useAuth } from '@/hooks/useAuthStatus'
import { AuthenticationStatus } from '@rainbow-me/rainbowkit'

type userContextType = {
  userAddress: Address | undefined
  authStatus: AuthenticationStatus
  isSigningIn: boolean
  handleSignIn: () => void
  handleSignOut: () => void
}

type Props = {
  children: React.ReactNode
}

const userContext = createContext<userContextType | undefined>(undefined)

export const UserProvider: React.FC<Props> = ({ children }) => {
  const [isSigningIn, setIsSigningIn] = useState(false)

  const { address } = useAccount()
  const { authStatus, verify, refetchAuthStatus, signOut, disconnect } = useAuth()

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

  const handleSignOut = () => {
    signOut()
  }

  return (
    <userContext.Provider
      value={{
        userAddress: address,
        authStatus,
        isSigningIn,
        handleSignIn,
        handleSignOut,
      }}
    >
      {children}
    </userContext.Provider>
  )
}

export const useUserContext = (): userContextType => {
  const context = useContext(userContext)
  if (context === undefined) {
    throw new Error('useUserContext must be used within an UserContextProvider')
  }
  return context
}
