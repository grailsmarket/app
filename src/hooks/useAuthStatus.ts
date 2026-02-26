import { useEffect, useRef, useState } from 'react'
import { useAccount, useDisconnect } from 'wagmi'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AuthenticationStatus } from '@rainbow-me/rainbowkit'
import { logout } from '@/api/siwe/logout'
import { DAY_IN_SECONDS } from '@/constants/time'
import { verifySignature } from '@/api/siwe/verifySignature'
import { checkAuthentication } from '@/api/siwe/checkAuthentication'
import { useAppDispatch } from '@/state/hooks'
import {
  resetUserProfile,
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
  const { address } = useAccount()
  const dispatch = useAppDispatch()
  const { disconnect } = useDisconnect()
  const queryClient = useQueryClient()

  // Tracks whether the user has interacted with the page.
  // Auto-connect happens on load without interaction; manual connect requires
  // a click/tap on "Connect Wallet" which fires pointerdown first.
  const hasUserInteracted = useRef(false)

  useEffect(() => {
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
        const token = document.cookie
          .split(';')
          .find((cookie) => cookie.trim().startsWith('token='))
          ?.split('=')[1]

          console.log('token', token)
        if (token && token.length > 0) {
          console.log('token found')
          setIsSigningIn(true)
        }

        const authenticateRes = await checkAuthentication()

        if (authenticateRes.success) {
          setUserDetails(authenticateRes.data)
          return 'authenticated'
        }

        dispatch(resetUserProfile())

        // console.log(document.cookie.split(';').find(cookie => cookie.trim().startsWith('token='))?.split('=')[1])
        // check if the token exists, since auth verification fialed, the user should be disconnected
        // const token = document.cookie
        //   .split(';')
        //   .find((cookie) => cookie.trim().startsWith('token='))
        //   ?.split('=')[1]
        // if ((token && token.length > 0)) {
        //   disconnect()
        //   document.cookie = `token=; path=/; max-age=0;`
        // }

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
    // refetchInterval: 1000 * 60 * 5, // 5 minutes
  })

  // If the wallet auto connected (no user interaction) but auth fails,
  // disconnect so the user gets a clean state and can reconnect fresh.
  // This fixes mobile where a stale WalletConnect session was preventing users from signing in.
  useEffect(() => {
    if (authStatus === 'unauthenticated' && !hasUserInteracted.current) {
      disconnect()
      document.cookie = `token=; path=/; max-age=0; SameSite=None; Secure`
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus])

  useEffect(() => {
    if (!address) return

    if (currAddress && address.toLowerCase() !== currAddress.toLowerCase()) {
      logout()
      dispatch(resetUserProfile())
      document.cookie = `token=; path=/; max-age=0; SameSite=None; Secure`
    }

    setCurrAddress(address)
    refetchAuthStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, refetchAuthStatus])

  const verify = async (message: string, _: string, signature: string) => {
    const verifyRes = await verifySignature(message, signature)
    const { user, token } = verifyRes

    if (!token) {
      dispatch(resetUserProfile())
      return
    }

    setUserDetails(user)
    queryClient.setQueryData(['auth', 'status', address], 'authenticated')
    console.log('setting token', token)
    document.cookie = `token=${token}; path=/; max-age=${DAY_IN_SECONDS}; SameSite=None; Secure`

    return
  }

  const signOut = async () => {
    disconnect()
    logout()
    document.cookie = `token=; path=/; max-age=0; SameSite=None; Secure`
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
