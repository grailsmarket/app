'use client'

import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { deleteComment, type DeleteCommentError } from '@/api/comments/deleteComment'
import type { CommentsResponse } from '@/types/comment'

interface CommentsPage extends CommentsResponse {}

/**
 * Self-delete: optimistically yanks the row from the cached pages, rolls back
 * on failure. No quota refetch — self-deletes don't free a quota slot since
 * the rolling-24h count is by created_at, not by current visibility.
 */
export const useDeleteComment = (name: string) => {
  const queryClient = useQueryClient()

  return useMutation<{ id: string }, DeleteCommentError, string, { snapshot: InfiniteData<CommentsPage> | undefined }>({
    mutationFn: (id: string) => deleteComment({ id }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['comments', name] })
      const snapshot = queryClient.getQueryData<InfiniteData<CommentsPage>>(['comments', name])

      queryClient.setQueryData<InfiniteData<CommentsPage>>(['comments', name], (old) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            comments: page.comments.filter((c) => c.id !== id),
          })),
        }
      })

      return { snapshot }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.snapshot) {
        queryClient.setQueryData(['comments', name], ctx.snapshot)
      }
    },
  })
}
