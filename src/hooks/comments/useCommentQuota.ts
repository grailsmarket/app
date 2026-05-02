'use client'

import { useQuery } from '@tanstack/react-query'
import { getCommentQuota } from '@/api/comments/getQuota'
import { useUserContext } from '@/context/user'

export const useCommentQuota = () => {
  const { authStatus } = useUserContext()

  return useQuery({
    queryKey: ['comments', 'quota'],
    queryFn: getCommentQuota,
    enabled: authStatus === 'authenticated',
    staleTime: 30_000,
  })
}
