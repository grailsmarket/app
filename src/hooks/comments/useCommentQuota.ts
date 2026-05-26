'use client'

import { useQuery } from '@tanstack/react-query'
import { getCommentQuota } from '@/api/comments/getQuota'
import { useUserContext } from '@/context/user'

interface UseCommentQuotaOptions {
  enabled?: boolean
}

export const useCommentQuota = ({ enabled = true }: UseCommentQuotaOptions = {}) => {
  const { authStatus } = useUserContext()

  return useQuery({
    queryKey: ['comments', 'quota'],
    queryFn: getCommentQuota,
    enabled: enabled && authStatus === 'authenticated',
    staleTime: 30_000,
  })
}
