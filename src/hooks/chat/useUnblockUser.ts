'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { removeBlock } from '@/api/blocks/removeBlock'

/** Unblock by user id (the same id the inbox row carries on the peer participant). */
export const useUnblockUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: number) => removeBlock(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats', 'inbox'] })
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) && query.queryKey[0] === 'chats' && query.queryKey[2] === 'detail',
      })
    },
  })
}
