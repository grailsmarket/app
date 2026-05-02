'use client'

import React, { useEffect, useRef, useState } from 'react'
import LoadingCell from '@/components/ui/loadingCell'
import CommentRow from '@/components/comments/commentRow'
import CommentComposer from '@/components/comments/composer'
import DeleteCommentModal from '@/components/comments/deleteCommentModal'
import { useComments } from '@/hooks/comments/useComments'
import { useDeleteComment } from '@/hooks/comments/useDeleteComment'
import { useUserContext } from '@/context/user'
import type { Comment } from '@/types/comment'

interface Props {
  name: string
}

const CommentsPanel: React.FC<Props> = ({ name }) => {
  const { authStatus, userAddress } = useUserContext()
  const {
    comments,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useComments(name)

  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Comment | null>(null)
  const deleteMutation = useDeleteComment(name)

  // Lazy-load older comments when the bottom sentinel scrolls into view.
  // Using IntersectionObserver scoped to the panel keeps page-scroll out of it.
  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !hasNextPage) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const lowerAddr = userAddress?.toLowerCase()

  return (
    <div className='sm:border-tertiary bg-secondary pt-lg flex w-full flex-col gap-1 sm:rounded-lg sm:border-2 lg:gap-2'>
      <div className='px-lg xl:px-xl flex items-center justify-between'>
        <h2 className='font-sedan-sc text-3xl'>Comments</h2>
        <span className='text-neutral text-lg'>{comments.length}</span>
      </div>

      <div className='px-lg xl:px-xl max-h-[480px] w-full overflow-y-auto'>
        {isLoading ? (
          <div className='flex h-[200px] w-full animate-pulse flex-col items-center justify-center gap-3'>
            <LoadingCell height='20px' width='140px' radius='4px' />
            <span className='text-neutral text-md'>Loading comments…</span>
          </div>
        ) : comments.length === 0 ? (
          <div className='py-2xl flex w-full flex-col items-center justify-center gap-3'>
            <p className='text-neutral text-md'>No comments yet</p>
          </div>
        ) : (
          <>
            {comments.map((c) => (
              <CommentRow
                key={c.id}
                comment={c}
                canDelete={!!lowerAddr && c.author_address?.toLowerCase() === lowerAddr}
                onRequestDelete={setPendingDelete}
              />
            ))}
            <div ref={sentinelRef} />
            {isFetchingNextPage && (
              <div className='py-md flex w-full items-center justify-center'>
                <span className='text-neutral text-sm'>Loading more…</span>
              </div>
            )}
          </>
        )}
      </div>

      {authStatus === 'authenticated' ? (
        <CommentComposer name={name} />
      ) : (
        <div className='border-tertiary text-neutral px-lg py-md text-md border-t-2 text-center'>
          Sign in to leave a comment.
        </div>
      )}

      <DeleteCommentModal
        isOpen={!!pendingDelete}
        isLoading={deleteMutation.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return
          deleteMutation.mutate(pendingDelete.id, {
            onSettled: () => setPendingDelete(null),
          })
        }}
      />
    </div>
  )
}

export default CommentsPanel
