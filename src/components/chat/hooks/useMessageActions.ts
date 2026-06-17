'use client'

import { useEffect, useRef, useState } from 'react'
import type { ChatMessage } from '@/types/chat'
import { useUserContext } from '@/context/user'
import { useDeleteMessage } from '@/hooks/chat/useDeleteMessage'
import { useEditMessage } from '@/hooks/chat/useEditMessage'
import type { ContextMenuItem } from '@/components/ui/contextMenu'

/**
 * Per-message actions shared by the DM and global rows. Reply is available to
 * any authenticated user on a live message; Edit/Delete are gated to the
 * caller's own messages. Edit uses an inline draft and keeps the editor open
 * until the save succeeds: on failure the draft is preserved and an inline
 * error is surfaced (`editError`) so a typed edit is never silently lost.
 * `onReply` is supplied by the thread view to set its reply target.
 */
export const useMessageActions = (
  message: ChatMessage,
  chatId: string,
  isOwn: boolean,
  onReply?: (message: ChatMessage) => void
) => {
  const { authStatus } = useUserContext()
  const del = useDeleteMessage(chatId)
  const edit = useEditMessage(chatId)

  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(message.body ?? '')
  const [editError, setEditError] = useState<string | null>(null)
  // Hard re-entrancy guard: `edit.isPending` only flips on the next render, so a
  // rapid double-Enter could otherwise fire two mutations before it updates.
  const savingRef = useRef(false)

  // Mirror the draft to the latest body while the editor is closed, so a remote
  // edit (e.g. a WS edit from another device) can't leave a stale draft that
  // would clobber the newer body on the next open. Left untouched mid-edit so
  // the user's in-progress typing is never overwritten.
  useEffect(() => {
    if (!isEditing) setDraft(message.body ?? '')
  }, [message.body, isEditing])

  const isPersisted = !message.deleted_at && !message.id.startsWith('optimistic-')
  const canManage = authStatus === 'authenticated' && isOwn && isPersisted
  const canReply = authStatus === 'authenticated' && isPersisted && !!onReply

  const startEdit = () => {
    setEditError(null)
    setIsEditing(true)
  }

  const cancelEdit = () => {
    setEditError(null)
    setIsEditing(false)
  }

  const saveEdit = () => {
    if (savingRef.current) return
    const trimmed = draft.trim()
    // No-op when unchanged or emptied (delete is the path for removing a message).
    if (!trimmed || trimmed === message.body) {
      setEditError(null)
      setIsEditing(false)
      return
    }
    savingRef.current = true
    setEditError(null)
    edit.mutate(
      { messageId: message.id, body: trimmed },
      {
        // Keep the editor open until the server confirms, then close. On failure
        // leave it open with the draft + an inline error so the edit isn't lost.
        onSuccess: () => setIsEditing(false),
        onError: () => setEditError('Failed to save edit. Try again.'),
        onSettled: () => {
          savingRef.current = false
        },
      }
    )
  }

  // Reply first (available to everyone), then owner-only Edit/Delete.
  const menuItems: ContextMenuItem[] = [
    ...(canReply ? [{ label: 'Reply', onClick: () => onReply!(message) }] : []),
    ...(canManage
      ? [
          { label: 'Edit', onClick: startEdit },
          {
            label: 'Delete',
            destructive: true,
            confirmLabel: 'Confirm delete',
            onClick: () => del.mutate(message.id),
          },
        ]
      : []),
  ]

  return { menuItems, isEditing, draft, setDraft, cancelEdit, saveEdit, editError, isSaving: edit.isPending }
}
