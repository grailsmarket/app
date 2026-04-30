'use client'

import React, { useEffect, useState } from 'react'
import { Avatar, Cross, fetchAccount } from 'ethereum-identity-kit'
import { useQuery } from '@tanstack/react-query'
import { isAddress } from 'viem'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import {
  clearPresetRecipient,
  closeChatSidebar,
  openSidebarToList,
  openSidebarToThread,
  selectChatSidebar,
} from '@/state/reducers/chat/sidebar'
import { useDebounce } from '@/hooks/useDebounce'
import { useCreateChat } from '@/hooks/chat/useCreateChat'
import Input from '@/components/ui/input'
import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'
import { formatAddress } from '@/utils/formatAddress'
import ArrowBack from 'public/icons/arrow-back.svg'
import Image from 'next/image'

const errorMessage = (code: string, fallback: string): string => {
  switch (code) {
    case 'RECIPIENT_OPTED_OUT':
      return "This user isn't accepting messages"
    case 'BLOCKED':
      return "You can't message this user"
    case 'RECIPIENT_NOT_FOUND':
      return "Couldn't find that user"
    case 'SELF_CHAT_FORBIDDEN':
      return "You can't message yourself"
    case 'VALIDATION_ERROR':
      return 'Enter a valid address or .eth name'
    default:
      return fallback
  }
}

const NewChatView: React.FC = () => {
  const dispatch = useAppDispatch()
  const { presetRecipient } = useAppSelector(selectChatSidebar)
  const [input, setInput] = useState(presetRecipient ?? '')
  const debounced = useDebounce(input, 200)
  const createChat = useCreateChat()

  // Clear the preset after seeding the local input so the user can edit freely.
  useEffect(() => {
    if (presetRecipient) {
      dispatch(clearPresetRecipient())
    }
  }, [presetRecipient, dispatch])

  const { data: account, isLoading: isResolving } = useQuery({
    queryKey: ['account', debounced],
    queryFn: async () => {
      if (!debounced) return null
      if (!isAddress(debounced) && !debounced.includes('.')) return null
      const response = await fetchAccount(debounced)
      if (!isAddress(response?.address ?? '')) return null
      return response
    },
    enabled: !!debounced,
  })

  const canSubmit = !!input.trim() && !createChat.isPending
  const submit = () => {
    const value = input.trim()
    if (!value) return
    createChat.mutate(value, {
      onSuccess: (data) => {
        dispatch(openSidebarToThread({ chatId: data.chat.id }))
      },
    })
  }

  const errCode = createChat.error?.code
  const err = createChat.error
    ? errorMessage(errCode ?? '', createChat.error.message ?? 'Failed to start chat')
    : null

  return (
    <>
      <div className='border-tertiary flex items-center justify-between border-b-2 p-4'>
        <button
          onClick={() => dispatch(openSidebarToList())}
          className='hover:bg-primary/10 flex items-center gap-2 rounded-md p-1 transition-colors'
        >
          <Image src={ArrowBack} alt='' width={16} height={16} />
          <span className='text-lg font-semibold'>New chat</span>
        </button>
        <button
          onClick={() => dispatch(closeChatSidebar())}
          className='hover:bg-primary/10 rounded-md p-1 transition-colors'
          aria-label='Close'
        >
          <Cross className='text-foreground h-4 w-4 cursor-pointer' />
        </button>
      </div>

      <div className='flex flex-1 flex-col gap-4 overflow-y-auto p-4'>
        <Input
          label='To'
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='Address or ENS name'
        />

        {account?.address && !isResolving && (
          <div className='bg-secondary border-tertiary flex items-center gap-3 rounded-md border p-3'>
            <Avatar
              address={account.address as `0x${string}`}
              src={account.ens?.avatar ?? undefined}
              name={account.ens?.name ?? undefined}
              style={{ width: '32px', height: '32px' }}
            />
            <div className='min-w-0 flex-1'>
              <p className='text-foreground truncate font-semibold'>
                {account.ens?.name || formatAddress(account.address)}
              </p>
              {account.ens?.name && (
                <p className='text-neutral truncate text-sm'>{formatAddress(account.address)}</p>
              )}
            </div>
          </div>
        )}

        {err && <p className='text-md text-red-400'>{err}</p>}
      </div>

      <div className='border-tertiary flex flex-col gap-2 border-t-2 p-4'>
        <PrimaryButton
          onClick={submit}
          disabled={!canSubmit}
          className='w-full'
        >
          {createChat.isPending ? 'Starting…' : 'Start chat'}
        </PrimaryButton>
        <SecondaryButton onClick={() => dispatch(openSidebarToList())} className='w-full'>
          Cancel
        </SecondaryButton>
      </div>
    </>
  )
}

export default NewChatView
