import { useEffect, useState } from 'react'
import { useAccount, useDisconnect } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
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

export const useAuth = () => {
  const [currAddress, setCurrAddress] = useState<Address | null>(null)
  const { address } = useAccount()
  const dispatch = useAppDispatch()
  const { disconnect } = useDisconnect()

  const {
    data: authStatus,
    isLoading: authStatusIsLoading,
    refetch: refetchAuthStatus,
    isRefetching: authStatusIsRefetching,
  } = useQuery<AuthenticationStatus>({
    queryKey: ['auth', 'status'],
    queryFn: async () => {
      const authenticateRes = await checkAuthentication()

      if (authenticateRes.success) {
        dispatch(setUserId(authenticateRes.data.id))
        dispatch(setUserEmail({ address: authenticateRes.data.email, verified: authenticateRes.data.emailVerified }))
        dispatch(setUserDiscord(authenticateRes.data.discord))
        dispatch(setUserTelegram(authenticateRes.data.telegram))
        return 'authenticated'
      }

      dispatch(resetUserProfile())

      // check if the token exists, since auth verification fialed, the user should be disconnected
      if((document.cookie.split(';').find(cookie => cookie.trim().startsWith('token='))?.split('=')[1]?.length || 0) > 0) {
        disconnect()
        document.cookie = `token=; path=/; max-age=0;`
      }

      return 'unauthenticated'
    },
    placeholderData: 'loading',
    initialData: 'loading',
    enabled: !!address,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    // refetchInterval: 1000 * 60 * 5, // 5 minutes
  })

  useEffect(() => {
    if (!address) return

    if (currAddress && address.toLowerCase() !== currAddress.toLowerCase()) {
      logout()
      dispatch(resetUserProfile())
      document.cookie = `token=; path=/; max-age=0;`
    }

    refetchAuthStatus()
    setCurrAddress(address)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, refetchAuthStatus])

  const verify = async (message: string, _: string, signature: string) => {
    const verifyRes = await verifySignature(message, signature)
    const token = verifyRes.token

    if (!token) {
      dispatch(resetUserProfile())
      return
    }

    document.cookie = `token=${token}; path=/; max-age=${DAY_IN_SECONDS}; timestamp=${Date.now()};`
    return
  }

  const signOut = async () => {
    disconnect()
    await logout()
    setCurrAddress(null)
    dispatch(resetUserProfile())
    document.cookie = `token=; path=/; max-age=0;`
    await refetchAuthStatus()
  }

  return {
    address,
    verify,
    signOut,
    disconnect,
    authStatus,
    authStatusIsLoading,
    authStatusIsRefetching,
    refetchAuthStatus,
  }
}
