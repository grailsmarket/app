'use client'

import { useEffect, useRef, useState } from 'react'
import type { ChatMessage } from '@/types/chat'
import { useUserContext } from '@/context/user'
import { useDeleteMessage } from '@/hooks/chat/useDeleteMessage'
import { useEditMessage } from '@/hooks/chat/useEditMessage'
import type { ContextMenuItem } from '@/components/chat/components/contextMenu'
import CopyIcon from 'public/icons/copy.svg'
import EditIcon from 'public/icons/pencil-white.svg'
import DeleteIcon from 'public/icons/trash.svg'
import ReplyIcon from 'public/icons/reply.svg'

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
  const savingRef = useRef(false)

  useEffect(() => {
    if (!isEditing) setDraft(message.body ?? '')
  }, [message.body, isEditing])

  const isPersisted = !message.deleted_at && !message.id.startsWith('optimistic-')
  const canManage = authStatus === 'authenticated' && isOwn && isPersisted
  // Editing changes the text body; image messages have no editable text.
  const canEdit = canManage && message.content_type !== 'image'
  const canReply = authStatus === 'authenticated' && isPersisted && !!onReply
  // Copy is offered for any non-deleted message that still has body text.
  const canCopy = !message.deleted_at && !!message.body?.trim()

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
        onSuccess: () => setIsEditing(false),
        onError: () => setEditError('Failed to save edit. Try again.'),
        onSettled: () => {
          savingRef.current = false
        },
      }
    )
  }

  const copyText = () => {
    if (message.body) navigator.clipboard?.writeText(message.body)
  }

  // Reply now lives in its own hover icon; the overflow menu carries Copy
  // (anyone) followed by owner-only Edit/Delete.
  const menuItems: ContextMenuItem[] = [
    ...(canReply
      ? [
          {
            label: 'Reply',
            onClick: () => {
              onReply?.(message)
              document.getElementById('chat-composer-textarea')?.focus()
            },
            icon: ReplyIcon,
          },
        ]
      : []),
    ...(canCopy ? [{ label: 'Copy text', onClick: copyText, icon: CopyIcon }] : []),
    ...(canEdit ? [{ label: 'Edit', onClick: startEdit, icon: EditIcon }] : []),
    ...(canManage
      ? [
          {
            label: 'Delete',
            destructive: true,
            confirmLabel: 'Confirm delete',
            onClick: () => del.mutate(message.id),
            icon: DeleteIcon,
          },
        ]
      : []),
  ]

  return { menuItems, canReply, isEditing, draft, setDraft, cancelEdit, saveEdit, editError, isSaving: edit.isPending }
}
