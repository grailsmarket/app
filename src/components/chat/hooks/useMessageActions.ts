'use client'

import { useEffect, useState } from 'react'
import type { ChatMessage } from '@/types/chat'
import { useUserContext } from '@/context/user'
import { useDeleteMessage } from '@/hooks/chat/useDeleteMessage'
import { useEditMessage } from '@/hooks/chat/useEditMessage'
import type { ContextMenuItem } from '@/components/ui/contextMenu'

/**
 * Per-message owner actions (edit + delete) shared by the DM and global rows.
 * `canManage` gates the kebab menu to the caller's own, non-deleted, persisted
 * messages. Edit uses an inline draft; save is optimistic (the row closes
 * immediately and the mutation rolls the cache back on failure).
 */
export const useMessageActions = (message: ChatMessage, chatId: string, isOwn: boolean) => {
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

  const canManage =
    authStatus === 'authenticated' && isOwn && !message.deleted_at && !message.id.startsWith('optimistic-')

  const startEdit = () => setIsEditing(true)

  const cancelEdit = () => setIsEditing(false)

  const saveEdit = () => {
    const trimmed = draft.trim()
    setIsEditing(false)
    // No-op when unchanged or emptied (delete is the path for removing a message).
    if (!trimmed || trimmed === message.body) return
    edit.mutate({ messageId: message.id, body: trimmed })
  }

  const menuItems: ContextMenuItem[] = [
    { label: 'Edit', onClick: startEdit },
    { label: 'Delete', destructive: true, confirmLabel: 'Confirm delete', onClick: () => del.mutate(message.id) },
  ]

  return { canManage, menuItems, isEditing, draft, setDraft, cancelEdit, saveEdit }
}
