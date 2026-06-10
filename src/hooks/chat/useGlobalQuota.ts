'use client'

import { useQuery } from '@tanstack/react-query'
import { getGlobalQuota } from '@/api/globalChat/getQuota'
import { useUserContext } from '@/context/user'

export const useGlobalQuota = () => {
  const { userAddress, authStatus } = useUserContext()

  return useQuery({
    queryKey: ['globalChat', 'quota'],
    queryFn: getGlobalQuota,
    enabled: !!userAddress && authStatus === 'authenticated',
    staleTime: 60_000,
  })
}
