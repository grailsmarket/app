'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import {
  DEFAULT_FALLBACK_AVATAR,
  DEFAULT_FALLBACK_HEADER,
  Check,
  Avatar,
  fetchAccount,
  LoadingCell,
} from 'ethereum-identity-kit'
import { useEditRecords } from './useEditRecords'
import ImageUploadModal from './imageUploadModal'
import Input from '@/components/ui/input'
import Textarea from '@/components/ui/textarea'
import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'
import { useQuery } from '@tanstack/react-query'
import { isAddress, type Address } from 'viem'
import PencilIcon from 'public/icons/pencil.svg'
import PlusIcon from 'public/icons/plus.svg'
import CrossIcon from 'public/icons/cross.svg'
import XLogo from 'public/logos/x.svg'
import GithubLogo from 'public/logos/github.svg'
import TelegramLogo from 'public/logos/telegram.svg'
import DiscordLogo from 'public/logos/discord.svg'
import { useClickAway } from '@/hooks/useClickAway'
import { cn } from '@/utils/tailwind'
import { beautifyName } from '@/lib/ens'

interface EditRecordsModalProps {
  name: string
  metadata: Record<string, string> | null
  defaultTab: 'records' | 'roles'
  onClose: () => void
}

const SOCIAL_RECORDS = [
  { key: 'com.twitter', label: 'Twitter / X', icon: XLogo, placeholder: 'username' },
  { key: 'com.github', label: 'GitHub', icon: GithubLogo, placeholder: 'username' },
  { key: 'org.telegram', label: 'Telegram', icon: TelegramLogo, placeholder: 'username' },
  { key: 'com.discord', label: 'Discord', icon: DiscordLogo, placeholder: 'username' },
] as const

const ADDRESS_LABELS: Record<string, string> = {
  btc: 'BTC',
  // sol: 'SOL',
  // doge: 'DOGE',
}

const RoleInputResolution: React.FC<{
  value: string
  resolvedAddress: string | null
  isResolving: boolean
}> = ({ value, resolvedAddress, isResolving }) => {
  const { data: resolvedProfile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['ens metadata', isAddress(value) ? value : resolvedAddress],
    queryFn: async () => {
      const addr = (isAddress(value) ? value : resolvedAddress) as Address
      const account = await fetchAccount(addr)
      return account?.ens || { name: null, avatar: null }
    },
    enabled: !!(isAddress(value) || (resolvedAddress && isAddress(resolvedAddress))),
  })

  const showResolution = value.includes('.') || (isAddress(value) && resolvedProfile?.name)

  if (!showResolution && !isResolving) return null

  return (
    <div
      className={cn(
        'flex h-10 items-center gap-2 pl-3 text-sm font-medium',
        (value.includes('.') && resolvedAddress && resolvedAddress.length > 0) || resolvedProfile?.name
          ? 'opacity-80'
          : 'text-red-400'
      )}
    >
      {isResolving || isProfileLoading ? (
        <>
          <LoadingCell height='24px' width='24px' radius='4px' />
          <LoadingCell height='20px' width='100%' radius='4px' />
        </>
      ) : (
        <>
          <Avatar
            name={resolvedProfile?.name || value}
            style={{ height: '26px', width: '26px' }}
            src={resolvedProfile?.avatar}
          />
          <p className='truncate text-lg font-semibold'>
            {value.includes('.')
              ? resolvedAddress && resolvedAddress.length > 0
                ? resolvedAddress
                : 'No resolution'
              : resolvedProfile?.name
                ? beautifyName(resolvedProfile?.name)
                : 'No resolution'}
          </p>
        </>
      )}
    </div>
  )
}

const EditRecordsModal: React.FC<EditRecordsModalProps> = ({ name, metadata, defaultTab, onClose }) => {
  const {
    records,
    setRecord,
    addressRecords,
    setAddressRecord,
    visibleAddressRecords,
    addVisibleAddressRecord,
    hiddenAddressRecords,
    customRecords,
    setCustomRecord,
    addCustomRecord,
    removeCustomRecord,
    visibleCustomRecordKeys,
    roleOwner,
    setRoleOwner,
    resolvedRoleOwner,
    roleOwnerResolving,
    roleManager,
    setRoleManager,
    resolvedRoleManager,
    roleManagerResolving,
    roleEthRecord,
    setRoleEthRecord,
    resolvedRoleEthRecord,
    roleEthRecordResolving,
    isRoleResolving,
    step,
    imageUploadTarget,
    setImageUploadTarget,
    hasChanges,
    saveRecords,
    resetToEditing,
    errorMessage,
    txHash,
    isManager,
    isOwner,
  } = useEditRecords(name, metadata)

  const [activeTab, setActiveTab] = useState<'records' | 'roles'>(defaultTab || 'records')
  const [addRecordOpen, setAddRecordOpen] = useState(false)
  const [customKeyInput, setCustomKeyInput] = useState('')
  const [isAddingCustomKey, setIsAddingCustomKey] = useState(false)
  const clickAwayRecordRef = useClickAway<HTMLDivElement>(() => {
    setAddRecordOpen(false)
    setIsAddingCustomKey(false)
    setCustomKeyInput('')
  })

  const avatarUrl = records.avatar
    ? records.avatar.startsWith('http')
      ? records.avatar
      : `https://metadata.ens.domains/mainnet/avatar/${name}`
    : DEFAULT_FALLBACK_AVATAR
  const headerUrl = records.header
    ? records.header.startsWith('http')
      ? records.header
      : `https://metadata.ens.domains/mainnet/header/${name}`
    : DEFAULT_FALLBACK_HEADER

  const handleImageSave = (url: string) => {
    if (imageUploadTarget) {
      setRecord(imageUploadTarget, url)
      setImageUploadTarget(null)
    }
  }

  const handleClose = () => {
    if (step === 'processing') return
    onClose()
  }

  return (
    <>
      <div
        className='fixed top-0 right-0 bottom-0 left-0 z-[100] flex h-[100dvh] w-screen items-end justify-end bg-black/40 backdrop-blur-sm transition-all duration-250 md:items-center md:justify-center md:px-2 md:py-12'
        onClick={(e) => {
          e.stopPropagation()
          handleClose()
        }}
      >
        <div
          className='bg-background border-tertiary relative flex max-h-[calc(100dvh-56px)] w-full flex-col rounded-md border-t shadow-lg md:max-w-xl md:border-2'
          onClick={(e) => e.stopPropagation()}
        >
          {/* Confirming / Processing state */}
          {(step === 'confirming' || step === 'processing') && (
            <div className='flex flex-col items-center gap-12 p-6'>
              <h2 className='text-2xl font-bold'>Saving Changes</h2>
              <div className='border-primary inline-block h-12 w-12 animate-spin rounded-full border-b-2'></div>
              <div className='flex flex-col items-center gap-4'>
                <p className='text-xl'>{step === 'confirming' ? 'Confirm in Wallet' : 'Processing Transaction'}</p>
                {txHash && (
                  <a
                    href={`https://etherscan.io/tx/${txHash}`}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-primary hover:text-primary/80 text-lg underline transition-colors'
                  >
                    View on Etherscan
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Success state */}
          {step === 'success' && (
            <div className='flex flex-col items-center gap-8 p-6'>
              <h2 className='text-2xl font-bold'>Saving Changes</h2>
              <div className='bg-primary mx-auto flex w-fit items-center justify-center rounded-full p-2'>
                <Check className='text-background h-6 w-6' />
              </div>
              <div className='flex w-full flex-col items-center gap-4'>
                <p className='text-xl font-bold'>Changes Saved Successfully!</p>
                {txHash && (
                  <a
                    href={`https://etherscan.io/tx/${txHash}`}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-primary hover:text-primary/80 text-lg underline transition-colors'
                  >
                    View on Etherscan
                  </a>
                )}
                <SecondaryButton className='w-full' onClick={onClose}>
                  Close
                </SecondaryButton>
              </div>
            </div>
          )}

          {/* Error state */}
          {step === 'error' && (
            <div className='flex flex-col gap-4 p-6'>
              <div className='rounded-lg border border-red-500/20 bg-red-900/20 p-4'>
                <h2 className='mb-4 text-2xl font-bold text-red-400'>Transaction Failed</h2>
                <p className='line-clamp-6 text-red-400'>{errorMessage || 'An unknown error occurred'}</p>
              </div>
              <div className='flex w-full flex-col gap-2'>
                <PrimaryButton onClick={resetToEditing} className='w-full'>
                  Try Again
                </PrimaryButton>
                <SecondaryButton onClick={onClose} className='w-full'>
                  Close
                </SecondaryButton>
              </div>
            </div>
          )}

          {/* Editing state — form content */}
          {step === 'editing' && (
            <>
              <div className='flex flex-col gap-3 overflow-y-auto pb-4'>
                {/* Header Image + Avatar */}
                <div className='relative'>
                  {/* Header image */}
                  <div className='relative h-32 w-full overflow-hidden rounded-t-md sm:h-36'>
                    <Image
                      src={headerUrl}
                      alt='Header'
                      className='h-full w-full object-cover'
                      width={1000}
                      height={200}
                    />
                    <button
                      className='absolute top-2 right-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-black/50 transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40'
                      onClick={() => setImageUploadTarget('header')}
                      disabled={!isManager}
                    >
                      <Image
                        src={records.header ? PencilIcon : PlusIcon}
                        alt='Edit header'
                        width={16}
                        height={16}
                        className='invert'
                      />
                    </button>
                  </div>

                  {/* Avatar overlapping header */}
                  <div className='absolute -bottom-9 left-4'>
                    <div className='relative h-20 w-20 overflow-hidden rounded-full border-4 border-[var(--background)] sm:h-26 sm:w-26'>
                      <Image
                        src={avatarUrl}
                        alt='Avatar'
                        width={80}
                        height={80}
                        className='h-full w-full object-cover'
                      />
                      <button
                        className='absolute inset-0 top-2/3 flex cursor-pointer items-center justify-center bg-black/50 transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40'
                        onClick={() => setImageUploadTarget('avatar')}
                        disabled={!isManager}
                      >
                        <Image
                          src={records.avatar ? PencilIcon : PlusIcon}
                          alt='Edit avatar'
                          width={14}
                          height={14}
                          className='invert'
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className='mt-8 flex gap-2 px-4 sm:px-6'>
                  <button
                    className={cn(
                      'flex-1 cursor-pointer rounded-md px-3 py-2 text-lg font-semibold transition-colors',
                      activeTab === 'records'
                        ? 'bg-primary text-background'
                        : 'bg-tertiary text-foreground hover:bg-[#4B4B4B]'
                    )}
                    onClick={() => setActiveTab('records')}
                  >
                    Records
                  </button>
                  <button
                    className={cn(
                      'flex-1 cursor-pointer rounded-md px-3 py-2 text-lg font-semibold transition-colors',
                      activeTab === 'roles'
                        ? 'bg-primary text-background'
                        : 'bg-tertiary text-foreground hover:bg-[#4B4B4B]'
                    )}
                    onClick={() => setActiveTab('roles')}
                  >
                    Roles
                  </button>
                </div>

                {/* Records tab */}
                {activeTab === 'records' && (
                  <>
                    {/* Text records */}
                    <div className='flex flex-col gap-3 px-4 sm:px-6'>
                      <div className='flex flex-col'>
                        <Input
                          label='ETH Record'
                          value={roleEthRecord}
                          onChange={(e) => {
                            const input = e.target.value
                            if (input.includes(' ')) return
                            setRoleEthRecord(input)
                          }}
                          placeholder='0x... or name.eth'
                          disabled={!isManager}
                          labelClassName='w-[140px]! text-nowrap'
                        />
                        <RoleInputResolution
                          value={roleEthRecord}
                          resolvedAddress={resolvedRoleEthRecord}
                          isResolving={roleEthRecordResolving}
                        />
                      </div>
                      <Textarea
                        label='Short Bio'
                        value={records.description || ''}
                        onChange={(e) => setRecord('description', e.target.value)}
                        placeholder='Tell us about yourself...'
                        disabled={!isManager}
                      />
                      <Input
                        label='Status'
                        value={records.status || ''}
                        onChange={(e) => setRecord('status', e.target.value)}
                        placeholder='What are you up to?'
                        disabled={!isManager}
                      />
                      <Input
                        label='Location'
                        value={records.location || ''}
                        onChange={(e) => setRecord('location', e.target.value)}
                        placeholder='Where are you based?'
                        disabled={!isManager}
                      />
                      <Input
                        label='Website'
                        value={records.url || ''}
                        onChange={(e) => setRecord('url', e.target.value)}
                        placeholder='https://yoursite.com'
                        disabled={!isManager}
                      />
                      <Input
                        label='Email'
                        value={records.email || ''}
                        onChange={(e) => setRecord('email', e.target.value)}
                        placeholder='you@example.com'
                        disabled={!isManager}
                      />
                    </div>

                    {/* Social records - 2x2 grid */}
                    <div className='grid grid-cols-2 gap-3 px-4 sm:px-6'>
                      {SOCIAL_RECORDS.map((social) => (
                        <div key={social.key} className='flex'>
                          <div className='bg-background border-tertiary flex h-12 min-w-[48px] items-center justify-center rounded-l-md border border-r-0'>
                            <Image src={social.icon} alt={social.label} width={20} height={20} />
                          </div>
                          <input
                            type='text'
                            value={records[social.key] || ''}
                            onChange={(e) => setRecord(social.key, e.target.value)}
                            className='bg-secondary border-tertiary hover:bg-tertiary focus:bg-tertiary flex h-12 w-full items-center rounded-r-md border px-3 py-2 text-left transition-colors hover:border-white/70 focus:border-white/70 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'
                            placeholder={social.placeholder}
                            disabled={!isManager}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Address records */}
                    {visibleAddressRecords.size > 0 && (
                      <div className='flex flex-col gap-3 px-4 sm:px-6'>
                        <h3 className='text-neutral text-lg font-semibold'>Address Records</h3>
                        {Array.from(visibleAddressRecords).map((key) => (
                          <Input
                            key={key}
                            label={ADDRESS_LABELS[key] || key.toUpperCase()}
                            value={addressRecords[key] || ''}
                            onChange={(e) => setAddressRecord(key, e.target.value)}
                            placeholder={`${ADDRESS_LABELS[key] || key.toUpperCase()} address`}
                            disabled={!isManager}
                          />
                        ))}
                      </div>
                    )}

                    {/* Custom records */}
                    {visibleCustomRecordKeys.length > 0 && (
                      <div className='flex flex-col gap-3 px-4 sm:px-6'>
                        {visibleCustomRecordKeys.map((key) => (
                          <div key={key} className='flex items-center gap-1'>
                            <Input
                              label={key}
                              value={customRecords[key] || ''}
                              onChange={(e) => setCustomRecord(key, e.target.value)}
                              placeholder={`Value for ${key}`}
                              className='flex-1'
                              labelClassName='w-[128px] max-w-[128px] break-all block py-3'
                              disabled={!isManager}
                            />
                            <button
                              className='hover:bg-tertiary flex h-12 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-50'
                              onClick={() => removeCustomRecord(key)}
                              disabled={!isManager}
                            >
                              <Image src={CrossIcon} alt='Remove' width={14} height={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Record button */}
                    <div className='relative max-w-full px-4 sm:px-6' ref={clickAwayRecordRef}>
                      <button
                        className='border-tertiary hover:bg-tertiary focus:bg-tertiary flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border-2 px-3 py-2 text-left transition-colors hover:border-white/70 focus:border-white/70 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'
                        onClick={() => setAddRecordOpen(!addRecordOpen)}
                        disabled={!isManager}
                      >
                        <Image src={PlusIcon} alt='Add' width={16} height={16} className='invert' />
                        Add Record
                      </button>

                      {addRecordOpen && (
                        <div className='bg-secondary border-tertiary absolute bottom-12 z-10 mb-1 flex w-[calc(100%-48px)] flex-col rounded-md border shadow-lg'>
                          {hiddenAddressRecords.map((key) => (
                            <button
                              key={key}
                              className='hover:bg-tertiary px-4 py-2 text-left text-lg font-medium transition-colors first:rounded-t-md last:rounded-b-md'
                              onClick={() => {
                                addVisibleAddressRecord(key)
                                setAddRecordOpen(false)
                              }}
                            >
                              {ADDRESS_LABELS[key] || key.toUpperCase()}
                            </button>
                          ))}
                          {isAddingCustomKey ? (
                            <div className='flex items-center gap-1 px-3 py-2'>
                              <input
                                type='text'
                                value={customKeyInput}
                                onChange={(e) => setCustomKeyInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && customKeyInput.trim()) {
                                    addCustomRecord(customKeyInput.trim())
                                    setCustomKeyInput('')
                                    setIsAddingCustomKey(false)
                                    setAddRecordOpen(false)
                                  }
                                }}
                                className='bg-tertiary flex-1 rounded-md px-3 py-1.5 text-lg font-semibold focus:outline-none'
                                placeholder='Record key...'
                                autoFocus
                              />
                              <button
                                className='bg-primary text-background rounded-md px-3 py-1.5 text-lg font-semibold disabled:opacity-50'
                                disabled={!customKeyInput.trim()}
                                onClick={() => {
                                  if (customKeyInput.trim()) {
                                    addCustomRecord(customKeyInput.trim())
                                    setCustomKeyInput('')
                                    setIsAddingCustomKey(false)
                                    setAddRecordOpen(false)
                                  }
                                }}
                              >
                                Add
                              </button>
                            </div>
                          ) : (
                            <button
                              className='hover:bg-tertiary px-4 py-2 text-left text-lg font-medium transition-colors last:rounded-b-md'
                              onClick={() => setIsAddingCustomKey(true)}
                            >
                              Custom Record
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Roles tab */}
                {activeTab === 'roles' && (
                  <div className='flex flex-col gap-3 px-4 sm:px-6'>
                    <div className='flex flex-col'>
                      <Input
                        label='Owner'
                        value={roleOwner}
                        onChange={(e) => {
                          const input = e.target.value
                          if (input.includes(' ')) return
                          setRoleOwner(input)
                        }}
                        placeholder='0x... or name.eth'
                        disabled={!isOwner}
                      />
                      <RoleInputResolution
                        value={roleOwner}
                        resolvedAddress={resolvedRoleOwner}
                        isResolving={roleOwnerResolving}
                      />
                    </div>
                    <div className='flex flex-col'>
                      <Input
                        label='Manager'
                        value={roleManager}
                        onChange={(e) => {
                          const input = e.target.value
                          if (input.includes(' ')) return
                          setRoleManager(input)
                        }}
                        placeholder='0x... or name.eth'
                        disabled={!isManager && !isOwner}
                      />
                      <RoleInputResolution
                        value={roleManager}
                        resolvedAddress={resolvedRoleManager}
                        isResolving={roleManagerResolving}
                      />
                    </div>
                    <div className='flex flex-col'>
                      <Input
                        label='ETH Record'
                        value={roleEthRecord}
                        onChange={(e) => {
                          const input = e.target.value
                          if (input.includes(' ')) return
                          setRoleEthRecord(input)
                        }}
                        placeholder='0x... or name.eth'
                        disabled={!isManager}
                        labelClassName='w-[140px]! text-nowrap'
                      />
                      <RoleInputResolution
                        value={roleEthRecord}
                        resolvedAddress={resolvedRoleEthRecord}
                        isResolving={roleEthRecordResolving}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className='border-tertiary flex flex-col gap-2 border-t p-4 sm:px-6'>
                {activeTab === 'records' && !isManager && (
                  <div className='bg-grace/10 border-tertiary flex flex-row items-center justify-between gap-2 rounded-md border p-4'>
                    <p className='text-grace text-md'>
                      You are not the <b>Manager</b> of this name. To edit records, set your current address as the{' '}
                      <b>Manager</b>.
                    </p>
                    <button
                      className='bg-grace text-background hover:bg-grace/80 cursor-pointer rounded-md px-2.5 py-1.5 text-lg font-semibold text-nowrap disabled:opacity-50'
                      onClick={() => {
                        setActiveTab('roles')
                        // if (userAddress) setRoleManager(userAddress)
                      }}
                    >
                      Set Role
                    </button>
                  </div>
                )}
                <PrimaryButton className='w-full' onClick={saveRecords} disabled={!hasChanges || isRoleResolving}>
                  Save
                </PrimaryButton>
                <SecondaryButton className='w-full' onClick={handleClose}>
                  Close
                </SecondaryButton>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Image upload nested modal */}
      {imageUploadTarget && (
        <ImageUploadModal
          name={name}
          imageType={imageUploadTarget}
          currentValue={records[imageUploadTarget] || ''}
          onSave={handleImageSave}
          onClose={() => setImageUploadTarget(null)}
        />
      )}
    </>
  )
}

export default EditRecordsModal
