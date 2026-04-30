'use client'

import React from 'react'
import type { ChatMessage, ChatParticipant } from '@/types/chat'

interface Props {
  /** Caller's most recent OWN message in the thread, or null. */
  lastOwnMessage: ChatMessage | null
  /** All loaded messages (oldest → newest). Used to compare positions by created_at. */
  messages: ChatMessage[]
  /** Participants other than caller. */
  otherParticipants: ChatParticipant[]
}

const ReadReceipt: React.FC<Props> = ({ lastOwnMessage, messages, otherParticipants }) => {
  if (!lastOwnMessage || otherParticipants.length === 0) return null

  // For direct chat (1 other participant) only — show "Seen" if that participant's
  // last_read_message_id corresponds to a message at-or-after lastOwnMessage.created_at.
  const peer = otherParticipants[0]
  if (!peer.last_read_message_id) return null

  const readMsg = messages.find((m) => m.id === peer.last_read_message_id)

  // If the peer's read pointer is for a message we haven't loaded, we can't
  // assert whether it's after our last own message. Be conservative: show Seen
  // only if we can confirm the order.
  if (!readMsg) return null

  const seen =
    new Date(readMsg.created_at).getTime() >= new Date(lastOwnMessage.created_at).getTime()
  if (!seen) return null

  return <p className='text-neutral mt-1 text-right text-sm'>Seen</p>
}

export default ReadReceipt
