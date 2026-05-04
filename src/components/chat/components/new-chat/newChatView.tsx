'use client'

import React, { useEffect, useState } from 'react'
import { Avatar, Cross, fetchAccount, HeaderImage } from 'ethereum-identity-kit'
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
import SecondaryButton from '@/components/ui/buttons/secondary'
import { formatAddress } from '@/utils/formatAddress'
import ArrowBack from 'public/icons/arrow-back.svg'
import Image from 'next/image'
import { ENS_METADATA_URL } from '@/constants/ens'
import EFPFriends from './EFPFrineds'
import { beautifyName } from '@/lib/ens'
import { Address } from 'viem'

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
  const debouncedSearch = useDebounce(input, 200)
  const createChat = useCreateChat()

  // Clear the preset after seeding the local input so the user can edit freely.
  useEffect(() => {
    if (presetRecipient) {
      dispatch(clearPresetRecipient())
    }
  }, [presetRecipient, dispatch])

  const { data: account, isLoading: isResolving } = useQuery({
    queryKey: ['account', debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch) return null
      if (!isAddress(debouncedSearch) && !debouncedSearch.includes('.')) return null
      const response = await fetchAccount(debouncedSearch)
      if (!isAddress(response?.address ?? '')) return null
      return response
    },
    enabled: !!debouncedSearch,
  })

  const accountAddress = account ? account.address : null
  const accountENSName = account ? account.ens?.name : null
  const displayName = accountENSName
    ? beautifyName(accountENSName)
    : accountAddress
      ? formatAddress(accountAddress)
      : null

  /**
   * We always send the resolved address (not the raw ENS string) to the backend.
   * The backend's address path auto-creates a stub `users` row when a recipient
   * has never signed in to Grails, while the ENS-string path 404s if the name
   * isn't tracked in our `ens_names` table. Sending the address makes "first
   * contact" with any wallet just work.
   */
  const submit = (address: Address) => {
    if (createChat.isPending) return

    const target = isAddress(address) ? address : null
    if (!target) return

    createChat.mutate(target, {
      onSuccess: (data) => dispatch(openSidebarToThread({ chatId: data.chat.id })),
    })
  }

  const errCode = createChat.error?.code
  const err = createChat.error ? errorMessage(errCode ?? '', createChat.error.message ?? 'Failed to start chat') : null

  return (
    <div className='flex h-full flex-col overflow-y-auto'>
      <div className='border-tertiary bg-background sticky top-0 z-10 flex items-center justify-between border-b-2 p-4'>
        <button
          onClick={() => dispatch(openSidebarToList())}
          className='hover:bg-primary/10 flex items-center gap-2 rounded-md p-1 transition-colors'
        >
          <Image src={ArrowBack} alt='' width={16} height={16} className='rotate-180' />
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

      <div className='flex flex-1 flex-col'>
        <div className='flex flex-col gap-3 p-4'>
          <Input
            label='To'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Address or ENS name'
          />
          {account?.address && !isResolving && (
            <button
              onClick={() => submit(account.address)}
              disabled={createChat.isPending}
              className='bg-secondary border-tertiary hover:bg-tertiary relative flex h-fit cursor-pointer items-center gap-3 rounded-md border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50'
            >
              {account.ens?.records['header'] && (
                <HeaderImage
                  name={displayName}
                  src={`${ENS_METADATA_URL}/mainnet/header/${accountENSName}`}
                  isLoading={false}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    opacity: 0.15,
                  }}
                />
              )}
              <Avatar
                address={accountAddress}
                src={`${ENS_METADATA_URL}/mainnet/avatar/${accountENSName}`}
                name={displayName}
                style={{ width: '32px', height: '32px' }}
              />
              <div className='min-w-0 flex-1'>
                <p className='text-foreground truncate font-semibold'>{displayName}</p>
                {accountAddress && <p className='text-neutral truncate text-sm'>{formatAddress(accountAddress)}</p>}
              </div>
              <span className='text-primary text-md font-semibold whitespace-nowrap'>
                {createChat.isPending ? 'Opening…' : 'Start chat →'}
              </span>
            </button>
          )}
          {err && <p className='text-md text-red-400'>{err}</p>}
        </div>
        {/* EFP Friends (Following) */}
        <div className='border-tertiary border-t'>
          <EFPFriends submit={submit} createChatIsPending={createChat.isPending} search={debouncedSearch} />
        </div>
      </div>

      <div className='border-tertiary bg-background sticky bottom-0 z-10 flex w-full flex-col gap-2 border-t-2 p-4'>
        <SecondaryButton onClick={() => dispatch(openSidebarToList())} className='w-full'>
          Cancel
        </SecondaryButton>
      </div>
    </div>
  )
}

export default NewChatView
