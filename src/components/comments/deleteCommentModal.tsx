'use client'

import React, { useEffect } from 'react'
import { cn } from '@/utils/tailwind'

interface Props {
  isOpen: boolean
  isLoading?: boolean
  onCancel: () => void
  onConfirm: () => void
}

const DeleteCommentModal: React.FC<Props> = ({ isOpen, isLoading, onCancel, onConfirm }) => {
  // Close on Escape unless we're mid-delete (prevent dismissing an in-flight
  // request, since a successful delete will close us anyway).
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, isLoading, onCancel])

  if (!isOpen) return null

  return (
    <div
      className='fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm'
      onClick={() => {
        if (!isLoading) onCancel()
      }}
      role='dialog'
      aria-modal='true'
      aria-labelledby='delete-comment-title'
    >
      <div
        className='bg-background border-tertiary p-lg flex w-[90vw] max-w-md flex-col gap-4 rounded-lg border-2 shadow-lg'
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id='delete-comment-title' className='font-sedan-sc text-foreground text-2xl'>
          Delete comment?
        </h2>
        <p className='text-neutral text-md'>
          Are you sure you want to delete this comment? This cannot be undone.
        </p>
        <div className='flex justify-end gap-2'>
          <button
            type='button'
            onClick={onCancel}
            disabled={isLoading}
            className='bg-secondary hover:bg-tertiary text-foreground rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50'
          >
            Cancel
          </button>
          <button
            type='button'
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              'rounded-md px-4 py-2 text-sm font-medium text-white transition-colors',
              'bg-red-500 hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50'
            )}
          >
            {isLoading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteCommentModal
