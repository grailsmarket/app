'use client'

import React from 'react'
import Image from 'next/image'
import SecondaryButton from '@/components/ui/buttons/secondary'
import { useUserContext } from '@/context/user'
import { useAppDispatch } from '@/state/hooks'
import { openSidebarToNew, openSidebarToThread } from '@/state/reducers/chat/sidebar'
import { useCreateChat } from '@/hooks/chat/useCreateChat'
import chatIcon from 'public/icons/chat.svg'
import { cn } from '@/utils/tailwind'

interface Props {
  /** Recipient: address or .eth name. */
  recipient: string
  className?: string
  label?: string
}

/**
 * One-click "Send message" affordance for profile/name pages. Resolves and
 * creates (or fetches) the direct chat in the background, then opens the
 * sidebar straight to the thread. On any error, falls back to the new-chat
 * view with the recipient pre-filled so the user sees the failure context.
 *
 * Hidden entirely when the viewer isn't signed in — chat is an authed-only
 * feature, so we don't surface a teaser that bounces them through SIWE.
 */
const SendMessageButton: React.FC<Props> = ({ recipient, className, label = 'Grails Chat' }) => {
  const { userAddress, authStatus } = useUserContext()
  const dispatch = useAppDispatch()
  const createChat = useCreateChat()

  if (!userAddress || authStatus !== 'authenticated') return null

  // Don't surface this on your own profile.
  if (recipient && userAddress.toLowerCase() === recipient.toLowerCase()) return null

  const handleClick = () => {
    createChat.mutate(recipient, {
      onSuccess: (data) => dispatch(openSidebarToThread({ chatId: data.chat.id })),
      onError: () => dispatch(openSidebarToNew({ recipient })),
    })
  }

  return (
    <SecondaryButton
      onClick={handleClick}
      disabled={createChat.isPending}
      className={cn('flex items-center justify-center gap-1.5', className)}
    >
      <Image src={chatIcon} alt='' width={16} height={16} />
      {createChat.isPending ? 'Opening…' : label}
    </SecondaryButton>
  )
}

export default SendMessageButton
