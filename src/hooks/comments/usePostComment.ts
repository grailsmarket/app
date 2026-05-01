'use client'

import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { postComment, type PostCommentError } from '@/api/comments/postComment'
import type { Comment, CommentsResponse, PostCommentResponse } from '@/types/comment'
import { useUserContext } from '@/context/user'

interface CommentsPage extends CommentsResponse {}

/**
 * Optimistically prepends the new comment, rolls back on failure, and refetches
 * the quota counter on success so the composer's "X/Y remaining" stays honest.
 */
export const usePostComment = (name: string) => {
  const queryClient = useQueryClient()
  const { userAddress } = useUserContext()

  return useMutation<
    PostCommentResponse,
    PostCommentError,
    string,
    { tempId: string } | undefined
  >({
    mutationFn: (body: string) => postComment({ name, body }),
    onMutate: async (body) => {
      await queryClient.cancelQueries({ queryKey: ['comments', name] })

      const tempId = `optimistic-${Date.now()}-${Math.random().toString(36).slice(2)}`
      const optimistic: Comment = {
        id: tempId,
        ens_name_id: -1,
        user_id: -1,
        body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        author_address: userAddress?.toLowerCase() ?? '',
        author_persona_id: null,
      }

      queryClient.setQueryData<InfiniteData<CommentsPage>>(['comments', name], (old) => {
        if (!old || old.pages.length === 0) {
          return {
            pageParams: [undefined],
            pages: [{ comments: [optimistic], nextCursor: null }],
          }
        }
        const [first, ...rest] = old.pages
        return {
          ...old,
          pages: [{ ...first, comments: [optimistic, ...first.comments] }, ...rest],
        }
      })

      return { tempId }
    },
    onSuccess: (response, _body, ctx) => {
      queryClient.setQueryData<InfiniteData<CommentsPage>>(['comments', name], (old) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page, i) =>
            i === 0
              ? {
                  ...page,
                  comments: page.comments.map((c) =>
                    c.id === ctx?.tempId ? response.comment : c
                  ),
                }
              : page
          ),
        }
      })
      // Force a fresh quota fetch — used count just incremented server-side.
      queryClient.invalidateQueries({ queryKey: ['comments', 'quota'] })
    },
    onError: (_err, _body, ctx) => {
      if (!ctx) return
      queryClient.setQueryData<InfiniteData<CommentsPage>>(['comments', name], (old) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            comments: page.comments.filter((c) => c.id !== ctx.tempId),
          })),
        }
      })
    },
  })
}
