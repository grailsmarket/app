import { useEffect, useRef, useState } from 'react'
import { useAccount, useDisconnect } from 'wagmi'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AuthenticationStatus } from '@rainbow-me/rainbowkit'
import { logout } from '@/api/siwe/logout'
import { verifySignature } from '@/api/siwe/verifySignature'
import { checkAuthentication } from '@/api/siwe/checkAuthentication'
import { useAppDispatch } from '@/state/hooks'
import {
  resetUserProfile,
  setNotifyOnListingSold,
  setNotifyOnOfferReceived,
  setOfferNotificationThreshold,
  setUserDiscord,
  setUserEmail,
  setUserId,
  setUserTelegram,
} from '@/state/reducers/portfolio/profile'
import { Address } from 'viem'
import { AuthUserType } from '@/types/api'

export const useAuth = () => {
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [currAddress, setCurrAddress] = useState<Address | null>(null)
  const { address, connector } = useAccount()
  const dispatch = useAppDispatch()
  const { disconnect } = useDisconnect()
  const queryClient = useQueryClient()

  // Tracks whether the user has interacted with the page.
  // Auto-connect happens on load without interaction; manual connect requires
  // a click/tap on "Connect Wallet" which fires pointerdown first.
  // Uses sessionStorage so the flag survives page reloads caused by
  // mobile wallet redirect flows (like Coinbase Wallet),
  // but resets on fresh tab opens (clearing stale sessions as intended).
  const hasUserInteracted = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handler = () => {
      hasUserInteracted.current = true
    }

    window.addEventListener('pointerdown', handler)
    return () => window.removeEventListener('pointerdown', handler)
  }, [])

  const setUserDetails = (user: AuthUserType) => {
    dispatch(setUserId(user.id))
    dispatch(setUserEmail({ address: user.email, verified: user.emailVerified }))
    dispatch(setUserDiscord(user.discord))
    dispatch(setUserTelegram(user.telegram))
    dispatch(setOfferNotificationThreshold(user.minOfferThreshold))
    dispatch(setNotifyOnListingSold(user.notifyOnListingSold))
    dispatch(setNotifyOnOfferReceived(user.notifyOnOfferReceived))
  }

  const {
    data: authStatus,
    isLoading: authStatusIsLoading,
    refetch: refetchAuthStatus,
    isRefetching: authStatusIsRefetching,
  } = useQuery<AuthenticationStatus>({
    queryKey: ['auth', 'status', address],
    queryFn: async () => {
      try {
        setIsSigningIn(true)

        // The httpOnly cookie is sent automatically with this request.
        // No need to read document.cookie — the server validates the token.
        const authenticateRes = await checkAuthentication()

        if (authenticateRes.success) {
          setUserDetails(authenticateRes.data)
          return 'authenticated'
        }

        dispatch(resetUserProfile())
        return 'unauthenticated'
      } catch (error) {
        console.error('Error checking authentication:', error)
        return 'unauthenticated'
      } finally {
        setIsSigningIn(false)
      }
    },
    placeholderData: 'loading',
    initialData: 'loading',
    enabled: !!address,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  })

  // If the wallet auto connected (no user interaction) but auth fails,
  // disconnect so the user gets a clean state and can reconnect fresh.
  // This fixes mobile where a stale WalletConnect session was preventing users from signing in.
  // Exception: Coinbase Wallet uses redirect flows on mobile that cause a page reload,
  // resetting the ref. We use sessionStorage to preserve interaction state for that wallet only.
  useEffect(() => {
    if (authStatus !== 'unauthenticated' || connector?.id === 'coinbase') return

    if (!hasUserInteracted.current) {
      disconnect()
      // httpOnly cookie is cleared server-side via the logout endpoint
      logout()
    }
  }, [authStatus])

  useEffect(() => {
    if (!address) return

    if (currAddress && address.toLowerCase() !== currAddress.toLowerCase()) {
      // logout() clears the httpOnly cookie server-side
      logout()
      dispatch(resetUserProfile())
    }

    setCurrAddress(address)
    refetchAuthStatus()
  }, [address, refetchAuthStatus])

  const verify = async (message: string, _: string, signature: string) => {
    const verifyRes = await verifySignature(message, signature)
    const { user } = verifyRes

    if (!user) {
      dispatch(resetUserProfile())
      return
    }

    // The httpOnly cookie was already set by the /api/auth/verify server route.
    // No need to set document.cookie — the token is never exposed to JavaScript.
    setUserDetails(user)
    queryClient.setQueryData(['auth', 'status', address], 'authenticated')
  }

  const signOut = async () => {
    disconnect()
    // logout() calls the server which clears the httpOnly cookie
    await logout()

    sessionStorage.removeItem('hasUserInteracted')
    refetchAuthStatus()

    setCurrAddress(null)
    dispatch(resetUserProfile())
  }

  return {
    address,
    verify,
    signOut,
    disconnect,
    authStatus,
    authStatusIsLoading: authStatusIsLoading || isSigningIn,
    authStatusIsRefetching: authStatusIsRefetching || isSigningIn,
    refetchAuthStatus,
  }
}
