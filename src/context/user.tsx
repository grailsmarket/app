'use client'

import { useAccount } from 'wagmi'
import type { Address } from 'viem'
import { useContext, createContext, useEffect, useCallback, useState, SetStateAction, Dispatch } from 'react'
import { useSiwe } from 'ethereum-identity-kit'
import { DAY_IN_SECONDS } from '@/constants/time'
import { fetchNonce } from '@/api/siwe/fetchNonce'
import { useAuth } from '@/hooks/useAuthStatus'
import { AuthenticationStatus } from '@rainbow-me/rainbowkit'
import { useUserProfile } from '@/hooks/useUserProfile'
import { WatchlistItemType } from '@/types/domains'
import { useQuery } from '@tanstack/react-query'
import { useAppDispatch } from '@/state/hooks'
import {
  CartDomainType,
  setCartRegisteredDomains,
  setCartUnregisteredDomains,
} from '@/state/reducers/domains/marketplaceDomains'
import { getCart } from '@/api/cart/getCart'
import { checkPoap } from '@/api/user/checkPoap'
import { setUserPoapClaimed } from '@/state/reducers/portfolio/profile'

type userContextType = {
  userAddress: Address | undefined
  watchlist: WatchlistItemType[] | null | undefined
  authStatus: AuthenticationStatus
  authStatusIsLoading: boolean
  authStatusIsRefetching: boolean
  isCartOpen: boolean
  setIsCartOpen: Dispatch<SetStateAction<boolean>>
  isSigningIn: boolean
  handleSignIn: () => void
  handleSignOut: () => void
  profileIsLoading: boolean
  watchlistIsLoading: boolean
  refetchProfile: () => void
  refetchWatchlist: () => void
  cartDomains: CartDomainType[] | null | undefined
  isCartDomainsLoading: boolean
  isSettingsOpen: boolean
  setIsSettingsOpen: Dispatch<SetStateAction<boolean>>
  isPoapClaimed: boolean
  claimedPoapLink?: string
  handleGetNonce: () => Promise<string> | string
  verify: (message: string, nonce: string, signature: string) => Promise<void> | void
  handleSignInSuccess: () => void
  handleSignInError: (error: Error) => void
}

type Props = {
  children: React.ReactNode
}

const userContext = createContext<userContextType | undefined>(undefined)

export const UserProvider: React.FC<Props> = ({ children }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)

  const { address } = useAccount()
  const dispatch = useAppDispatch()
  const { authStatus, verify, refetchAuthStatus, signOut, disconnect, authStatusIsLoading, authStatusIsRefetching } =
    useAuth()
  const { profileIsLoading, refetchProfile, watchlist, watchlistIsLoading, refetchWatchlist } = useUserProfile({
    address,
    authStatus,
  })

  const { data: cartDomains, isLoading: isCartDomainsLoading } = useQuery({
    queryKey: ['cartDomains', address],
    queryFn: async () => {
      const result = await getCart(address)
      if (!result) return []
      dispatch(setCartRegisteredDomains(result.filter((domain) => domain.cartType === 'sales')))
      dispatch(setCartUnregisteredDomains(result.filter((domain) => domain.cartType === 'registrations')))
      return result
    },
    enabled: !!address && authStatus === 'authenticated',
  })

  const { data: poapClaimData } = useQuery({
    queryKey: ['isPoapClaimed', address],
    queryFn: async () => {
      if (!address) return { has_claimed: false }

      const result = await checkPoap()
      dispatch(setUserPoapClaimed(result.has_claimed))

      return result
    },
    enabled: !!address && authStatus === 'authenticated',
    initialData: { has_claimed: false },
  })

  const isPoapClaimed = poapClaimData?.has_claimed
  const claimedPoapLink = poapClaimData?.link

  const handleGetNonce = useCallback(async () => {
    if (!address) throw new Error('No address found')
    return await fetchNonce(address)
  }, [address])

  const handleSignInSuccess = async () => {
    await refetchAuthStatus()
    setIsSigningIn(false)
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

  // useEffect(() => {
  //   if (address && authStatus === 'unauthenticated') {
  //     setIsSigningIn(true)
  //     handleSignIn()
  //   }

  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [address, authStatus])

  const handleSignOut = () => {
    signOut()
  }

  return (
    <userContext.Provider
      value={{
        userAddress: address,
        watchlist,
        authStatus,
        authStatusIsLoading,
        authStatusIsRefetching,
        isSigningIn,
        isCartOpen,
        setIsCartOpen,
        handleSignIn,
        handleSignOut,
        profileIsLoading,
        watchlistIsLoading,
        refetchProfile,
        refetchWatchlist,
        cartDomains,
        isCartDomainsLoading,
        isSettingsOpen,
        setIsSettingsOpen,
        isPoapClaimed,
        claimedPoapLink,
        handleGetNonce,
        verify,
        handleSignInSuccess,
        handleSignInError,
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
