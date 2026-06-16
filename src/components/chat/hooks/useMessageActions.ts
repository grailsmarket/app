'use client'

import { useEffect, useState } from 'react'
import type { ChatMessage } from '@/types/chat'
import { useUserContext } from '@/context/user'
import { useDeleteMessage } from '@/hooks/chat/useDeleteMessage'
import { useEditMessage } from '@/hooks/chat/useEditMessage'
import type { ContextMenuItem } from '@/components/ui/contextMenu'

/**
 * Per-message actions shared by the DM and global rows. Reply is available to
 * any authenticated user on a live message; Edit/Delete are gated to the
 * caller's own messages (`canManage`). Edit uses an inline draft; save is
 * optimistic (the row closes immediately, the mutation rolls the cache back on
 * failure). `onReply` is supplied by the thread view to set its reply target.
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

  const startEdit = () => setIsEditing(true)

  const cancelEdit = () => setIsEditing(false)

  const saveEdit = () => {
    const trimmed = draft.trim()
    setIsEditing(false)
    // No-op when unchanged or emptied (delete is the path for removing a message).
    if (!trimmed || trimmed === message.body) return
    edit.mutate({ messageId: message.id, body: trimmed })
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

  return { canManage, canReply, menuItems, isEditing, draft, setDraft, cancelEdit, saveEdit }
}
