import { useEffect } from 'react'
import { useAccount, useDisconnect } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { AuthenticationStatus } from '@rainbow-me/rainbowkit'
import { logout } from '@/api/siwe/logout'
import { WEEK_IN_SECONDS } from '@/constants/time'
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

export const useAuth = () => {
  const { address } = useAccount()
  const dispatch = useAppDispatch()

  const {
    data: authStatus,
    isLoading: authStatusIsLoading,
    refetch: refetchAuthStatus,
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
      return 'unauthenticated'
    },
    placeholderData: 'loading',
    initialData: 'loading',
    enabled: !!address,
  })

  useEffect(() => {
    if (address) {
      refetchAuthStatus()
    }
  }, [address, refetchAuthStatus])

  const verify = async (message: string, _: string, signature: string) => {
    const verifyRes = await verifySignature(message, signature)
    const token = verifyRes.token

    if (!token) {
      dispatch(resetUserProfile())
      return
    }

    document.cookie = `token=${token}; path=/; max-age=${WEEK_IN_SECONDS};`
    await refetchAuthStatus()
    return
  }

  const { disconnect } = useDisconnect()
  const signOut = async () => {
    disconnect()
    logout()
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
    refetchAuthStatus,
  }
}
