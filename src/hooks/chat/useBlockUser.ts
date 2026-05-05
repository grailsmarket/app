'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { addBlock, type AddBlockError } from '@/api/blocks/addBlock'

/**
 * Block a user (by address or .eth name). On success invalidates the inbox so
 * the row's `is_blocked_by_me` flips and the muted styling applies. Also
 * invalidates any open chat detail queries so the thread composer disables.
 */
export const useBlockUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (user: string) => addBlock(user),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats', 'inbox'] })
      // Detail caches are keyed ['chats', <id>, 'detail'] — invalidate all of them.
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) && query.queryKey[0] === 'chats' && query.queryKey[2] === 'detail',
      })
    },
  }) as ReturnType<typeof useMutation<Awaited<ReturnType<typeof addBlock>>, AddBlockError, string>>
}
