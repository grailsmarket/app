'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { Check, LoadingCell } from 'ethereum-identity-kit'
import Input from '@/components/ui/input'
import Textarea from '@/components/ui/textarea'
import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'
import PlusIcon from 'public/icons/plus.svg'
import CrossIcon from 'public/icons/cross.svg'
import XLogo from 'public/logos/x.svg'
import GithubLogo from 'public/logos/github.svg'
import TelegramLogo from 'public/logos/telegram.svg'
import DiscordLogo from 'public/logos/discord.svg'
import ArrowDownIcon from 'public/icons/arrow-down.svg'
import { useClickAway } from '@/hooks/useClickAway'
import { cn } from '@/utils/tailwind'
import { beautifyName } from '@/lib/ens'
import { useBulkEditRecords, type TransactionStatus } from '@/hooks/useBulkEditRecords'
import { TEXT_RECORD_KEYS, ADDRESS_RECORD_KEYS } from '@/constants/ens/records'

interface BulkEditRecordsModalProps {
  names: string[]
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
}

const TransactionStatusRow: React.FC<{
  status: TransactionStatus
  index: number
  onRetry: (index: number) => void
}> = ({ status, index, onRetry }) => (
  <div className='border-tertiary flex items-center justify-between rounded-md border p-3'>
    <div className='flex flex-col gap-1'>
      <p className='text-md font-semibold'>
        Resolver {status.resolverAddress.slice(0, 6)}...{status.resolverAddress.slice(-4)}
      </p>
      <p className='text-neutral text-md'>
        {status.names.length} name{status.names.length !== 1 ? 's' : ''}
      </p>
    </div>
    <div className='flex items-center gap-2'>
      {status.status === 'pending' && <p className='text-neutral text-md'>Waiting</p>}
      {status.status === 'confirming' && (
        <div className='flex items-center gap-2'>
          <div className='border-primary h-4 w-4 animate-spin rounded-full border-b-2' />
          <p className='text-md'>Confirm in wallet</p>
        </div>
      )}
      {status.status === 'processing' && (
        <div className='flex items-center gap-2'>
          <div className='border-primary h-4 w-4 animate-spin rounded-full border-b-2' />
          <p className='text-md'>Processing</p>
        </div>
      )}
      {status.status === 'success' && (
        <div className='bg-primary rounded-full p-0.5'>
          <Check className='text-background h-3 w-3' />
        </div>
      )}
      {status.status === 'error' && (
        <button
          className='cursor-pointer rounded-md bg-red-900/30 px-2 py-1 text-sm text-red-400 hover:bg-red-900/50'
          onClick={() => onRetry(index)}
        >
          Retry
        </button>
      )}
      {status.txHash && (
        <a
          href={`https://etherscan.io/tx/${status.txHash}`}
          target='_blank'
          rel='noopener noreferrer'
          className='text-primary text-md hover:underline'
        >
          Tx
        </a>
      )}
    </div>
  </div>
)

const BulkEditRecordsModal: React.FC<BulkEditRecordsModalProps> = ({ names, onClose }) => {
  const {
    isLoadingRoles,
    managedNames,
    skippedNames,
    resolverGroups,
    sharedRecords,
    setSharedTextRecord,
    setSharedAddressRecord,
    setSharedEthAddress,
    setSharedContenthash,
    setSharedCustomRecord,
    addCustomRecordKey,
    removeCustomRecordKey,
    customRecordKeys,
    clearedFields,
    toggleClearField,
    perNameOverrides,
    setPerNameTextRecord,
    setPerNameEthAddress,
    setPerNameContenthash,
    getEffectiveRecords,
    editMode,
    setEditMode,
    step,
    hasChanges,
    errorMessage,
    transactionStatuses,
    saveRecords,
    retryTransaction,
    resetToEditing,
  } = useBulkEditRecords(names)

  const [addRecordOpen, setAddRecordOpen] = useState(false)
  const [customKeyInput, setCustomKeyInput] = useState('')
  const [isAddingCustomKey, setIsAddingCustomKey] = useState(false)
  const [expandedNames, setExpandedNames] = useState<Set<string>>(new Set())
  const [showSkippedNames, setShowSkippedNames] = useState(false)

  const clickAwayRecordRef = useClickAway<HTMLDivElement>(() => {
    setAddRecordOpen(false)
    setIsAddingCustomKey(false)
    setCustomKeyInput('')
  })

  const toggleExpandedName = (name: string) => {
    setExpandedNames((prev) => {
      const next = new Set(prev)
      if (next.has(name)) {
        next.delete(name)
      } else {
        next.add(name)
      }
      return next
    })
  }

  const handleClose = () => {
    if (step === 'confirming' || step === 'processing') return
    onClose()
  }

  return (
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
        {/* Loading roles state */}
        {step === 'loading_roles' && (
          <div className='flex flex-col items-center gap-6 p-6'>
            <h2 className='text-2xl font-bold'>Edit Records</h2>
            <div className='border-primary inline-block h-12 w-12 animate-spin rounded-full border-b-2' />
            <p className='text-neutral text-lg'>Loading name permissions...</p>
          </div>
        )}

        {/* Confirming / Processing state */}
        {(step === 'confirming' || step === 'processing') && (
          <div className='flex flex-col gap-4 p-6'>
            <h2 className='text-2xl font-bold'>Saving Changes</h2>
            <p className='text-neutral text-lg'>
              {transactionStatuses.length > 1
                ? `Processing ${transactionStatuses.length} transactions...`
                : step === 'confirming'
                  ? 'Confirm in Wallet'
                  : 'Processing Transaction'}
            </p>
            <div className='flex flex-col gap-2'>
              {transactionStatuses.map((status, i) => (
                <TransactionStatusRow key={i} status={status} index={i} onRetry={retryTransaction} />
              ))}
            </div>
          </div>
        )}

        {/* Success state */}
        {step === 'success' && (
          <div className='flex flex-col items-center gap-8 p-6'>
            <h2 className='text-2xl font-bold'>Edit Records</h2>
            <div className='bg-primary mx-auto flex w-fit items-center justify-center rounded-full p-2'>
              <Check className='text-background h-6 w-6' />
            </div>
            <div className='flex w-full flex-col items-center gap-4'>
              <p className='text-xl font-bold'>Records Updated Successfully!</p>
              <p className='text-neutral text-lg'>
                Updated {managedNames.length} name{managedNames.length !== 1 ? 's' : ''}
              </p>
              {transactionStatuses
                .filter((s) => s.txHash)
                .map((s, i) => (
                  <a
                    key={i}
                    href={`https://etherscan.io/tx/${s.txHash}`}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-primary hover:text-primary/80 text-lg underline transition-colors'
                  >
                    View Transaction {transactionStatuses.length > 1 ? i + 1 : ''} on Etherscan
                  </a>
                ))}
              <SecondaryButton className='w-full' onClick={onClose}>
                Close
              </SecondaryButton>
            </div>
          </div>
        )}

        {/* Error state */}
        {step === 'error' && (
          <div className='flex flex-col gap-4 p-6'>
            <h2 className='text-2xl font-bold'>Edit Records</h2>
            <div className='rounded-lg border border-red-500/20 bg-red-900/20 p-4'>
              <p className='text-red-400'>{errorMessage || 'One or more transactions failed'}</p>
            </div>
            <div className='flex flex-col gap-2'>
              {transactionStatuses.map((status, i) => (
                <TransactionStatusRow key={i} status={status} index={i} onRetry={retryTransaction} />
              ))}
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

        {/* Editing state */}
        {step === 'editing' && (
          <>
            <div className='flex flex-col gap-3 overflow-y-auto pb-4'>
              {/* Header */}
              <div className='flex items-center justify-between px-4 pt-4 sm:px-6'>
                <h2 className='text-2xl font-bold'>Edit Records</h2>
                <p className='text-neutral text-lg'>
                  {managedNames.length} name{managedNames.length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Warnings */}
              {skippedNames.length > 0 && (
                <div className='mx-4 sm:mx-6'>
                  <div className='bg-grace/10 border-tertiary rounded-md border p-3'>
                    <p className='text-grace text-md'>
                      You are not the manager of {skippedNames.length} name
                      {skippedNames.length !== 1 ? 's' : ''}. These will be skipped.
                    </p>
                    <button
                      className='text-grace/80 hover:text-grace mt-1 cursor-pointer text-sm underline'
                      onClick={() => setShowSkippedNames(!showSkippedNames)}
                    >
                      {showSkippedNames ? 'Hide' : 'Show'} names
                    </button>
                    {showSkippedNames && (
                      <div className='mt-2 flex flex-wrap gap-1'>
                        {skippedNames.map((name) => (
                          <span key={name} className='bg-tertiary rounded px-2 py-0.5 text-sm'>
                            {beautifyName(name)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {resolverGroups.length > 1 && (
                <div className='mx-4 sm:mx-6'>
                  <div className='border-tertiary rounded-md border bg-blue-900/10 p-3'>
                    <p className='text-md text-blue-300'>
                      Your names use {resolverGroups.length} different resolvers. This will require{' '}
                      {resolverGroups.length} separate transactions.
                    </p>
                    <div className='mt-2 flex flex-col gap-1'>
                      {resolverGroups.map((group) => (
                        <p key={group.resolverAddress} className='text-neutral text-sm'>
                          {group.resolverAddress.slice(0, 8)}...{group.resolverAddress.slice(-4)}: {group.names.length}{' '}
                          name{group.names.length !== 1 ? 's' : ''}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Mode toggle */}
              <div className='flex gap-2 px-4 sm:px-6'>
                <button
                  className={cn(
                    'flex-1 cursor-pointer rounded-md px-3 py-2 text-lg font-semibold transition-colors',
                    editMode === 'shared'
                      ? 'bg-primary text-background'
                      : 'bg-tertiary text-foreground hover:bg-[#4B4B4B]'
                  )}
                  onClick={() => setEditMode('shared')}
                >
                  Apply to All
                </button>
                <button
                  className={cn(
                    'flex-1 cursor-pointer rounded-md px-3 py-2 text-lg font-semibold transition-colors',
                    editMode === 'per-name'
                      ? 'bg-primary text-background'
                      : 'bg-tertiary text-foreground hover:bg-[#4B4B4B]'
                  )}
                  onClick={() => setEditMode('per-name')}
                >
                  Per Name
                </button>
              </div>

              {/* Shared mode */}
              {editMode === 'shared' && (
                <>
                  <div className='flex flex-col gap-3 px-4 sm:px-6'>
                    <Input
                      label='Ethereum'
                      value={sharedRecords.ethAddress}
                      onChange={(e) => {
                        if (e.target.value.includes(' ')) return
                        setSharedEthAddress(e.target.value)
                      }}
                      placeholder='0x... address for all names'
                      labelClassName='w-[140px]! text-nowrap'
                    />
                    <Textarea
                      label='Short Bio'
                      value={sharedRecords.textRecords.description || ''}
                      onChange={(e) => setSharedTextRecord('description', e.target.value)}
                      placeholder='Tell us about yourself...'
                    />
                    <Input
                      label='Status'
                      value={sharedRecords.textRecords.status || ''}
                      onChange={(e) => setSharedTextRecord('status', e.target.value)}
                      placeholder='What are you up to?'
                    />
                    <Input
                      label='Location'
                      value={sharedRecords.textRecords.location || ''}
                      onChange={(e) => setSharedTextRecord('location', e.target.value)}
                      placeholder='Where are you based?'
                    />
                    <Input
                      label='Website'
                      value={sharedRecords.textRecords.url || ''}
                      onChange={(e) => setSharedTextRecord('url', e.target.value)}
                      placeholder='https://yoursite.com'
                    />
                    <Input
                      label='Email'
                      value={sharedRecords.textRecords.email || ''}
                      onChange={(e) => setSharedTextRecord('email', e.target.value)}
                      placeholder='you@example.com'
                    />
                  </div>

                  {/* Socials */}
                  <div className='grid grid-cols-2 gap-3 px-4 sm:px-6'>
                    {SOCIAL_RECORDS.map((social) => (
                      <div key={social.key} className='flex'>
                        <div className='bg-background border-tertiary flex h-12 min-w-[48px] items-center justify-center rounded-l-md border border-r-0'>
                          <Image src={social.icon} alt={social.label} width={20} height={20} />
                        </div>
                        <input
                          type='text'
                          value={sharedRecords.textRecords[social.key] || ''}
                          onChange={(e) => setSharedTextRecord(social.key, e.target.value)}
                          className='bg-secondary border-tertiary hover:bg-tertiary focus:bg-tertiary flex h-12 w-full items-center rounded-r-md border px-3 py-2 text-left transition-colors hover:border-white/70 focus:border-white/70 focus:outline-none'
                          placeholder={social.placeholder}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Address records */}
                  <div className='flex flex-col gap-3 px-4 sm:px-6'>
                    <h3 className='text-neutral text-lg font-semibold'>Address Records</h3>
                    {ADDRESS_RECORD_KEYS.map((key) => (
                      <Input
                        key={key}
                        label={ADDRESS_LABELS[key] || key.toUpperCase()}
                        value={sharedRecords.addressRecords[key] || ''}
                        onChange={(e) => setSharedAddressRecord(key, e.target.value)}
                        placeholder={`${ADDRESS_LABELS[key] || key.toUpperCase()} address`}
                      />
                    ))}
                  </div>

                  {/* Contenthash */}
                  <div className='flex flex-col gap-3 px-4 sm:px-6'>
                    <Input
                      label='Contenthash'
                      value={sharedRecords.contenthash}
                      onChange={(e) => setSharedContenthash(e.target.value)}
                      placeholder='ipfs://... or ar://...'
                      labelClassName='w-[140px]! text-nowrap'
                    />
                  </div>

                  {/* Custom records */}
                  {customRecordKeys.length > 0 && (
                    <div className='flex flex-col gap-3 px-4 sm:px-6'>
                      {customRecordKeys.map((key) => (
                        <div key={key} className='flex items-center gap-1'>
                          <Input
                            label={key}
                            value={sharedRecords.customRecords[key] || ''}
                            onChange={(e) => setSharedCustomRecord(key, e.target.value)}
                            placeholder={`Value for ${key}`}
                            className='flex-1'
                            labelClassName='w-[128px] max-w-[128px] break-all block py-3'
                          />
                          <button
                            className='hover:bg-tertiary flex h-12 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors'
                            onClick={() => removeCustomRecordKey(key)}
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
                      className='border-tertiary hover:bg-tertiary focus:bg-tertiary flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border-2 px-3 py-2 text-left transition-colors hover:border-white/70 focus:border-white/70 focus:outline-none'
                      onClick={() => setAddRecordOpen(!addRecordOpen)}
                    >
                      <Image src={PlusIcon} alt='Add' width={16} height={16} className='invert' />
                      Add Record
                    </button>

                    {addRecordOpen && (
                      <div className='bg-secondary border-tertiary absolute bottom-12 z-10 mb-1 flex w-[calc(100%-48px)] flex-col rounded-md border shadow-lg'>
                        {isAddingCustomKey ? (
                          <div className='flex items-center gap-1 px-3 py-2'>
                            <input
                              type='text'
                              value={customKeyInput}
                              onChange={(e) => setCustomKeyInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && customKeyInput.trim()) {
                                  addCustomRecordKey(customKeyInput.trim())
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
                                  addCustomRecordKey(customKeyInput.trim())
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
                            className='hover:bg-tertiary px-4 py-2 text-left text-lg font-medium transition-colors rounded-md'
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

              {/* Per-name mode */}
              {editMode === 'per-name' && (
                <div className='flex flex-col gap-2 px-4 sm:px-6'>
                  <p className='text-neutral text-md mb-1'>
                    Override shared values for individual names. Leave blank to use shared values.
                  </p>
                  {managedNames.map((name) => {
                    const isExpanded = expandedNames.has(name)
                    const effective = getEffectiveRecords(name)
                    const override = perNameOverrides.get(name)
                    const hasOverride = override && Object.keys(override).some((k) => {
                      const val = override[k as keyof typeof override]
                      if (typeof val === 'string') return !!val
                      if (typeof val === 'object' && val) return Object.values(val).some((v) => !!v)
                      return false
                    })

                    return (
                      <div key={name} className='border-tertiary rounded-md border'>
                        <button
                          className='flex w-full cursor-pointer items-center justify-between p-3'
                          onClick={() => toggleExpandedName(name)}
                        >
                          <div className='flex items-center gap-2'>
                            <p className='text-lg font-semibold'>{beautifyName(name)}</p>
                            {hasOverride && (
                              <span className='bg-primary/20 text-primary rounded px-1.5 py-0.5 text-xs'>
                                customized
                              </span>
                            )}
                          </div>
                          <Image
                            src={ArrowDownIcon}
                            alt='Toggle'
                            width={16}
                            height={16}
                            className={cn('transition-transform', isExpanded && 'rotate-180')}
                          />
                        </button>

                        {isExpanded && (
                          <div className='border-tertiary flex flex-col gap-3 border-t p-3'>
                            <Input
                              label='Ethereum'
                              value={override?.ethAddress ?? ''}
                              onChange={(e) => {
                                if (e.target.value.includes(' ')) return
                                setPerNameEthAddress(name, e.target.value)
                              }}
                              placeholder={sharedRecords.ethAddress || '0x... (override)'}
                              labelClassName='w-[140px]! text-nowrap'
                            />
                            <Input
                              label='Short Bio'
                              value={override?.textRecords?.description ?? ''}
                              onChange={(e) => setPerNameTextRecord(name, 'description', e.target.value)}
                              placeholder={sharedRecords.textRecords.description || 'Override description...'}
                            />
                            <Input
                              label='Website'
                              value={override?.textRecords?.url ?? ''}
                              onChange={(e) => setPerNameTextRecord(name, 'url', e.target.value)}
                              placeholder={sharedRecords.textRecords.url || 'Override website...'}
                            />
                            <Input
                              label='Contenthash'
                              value={override?.contenthash ?? ''}
                              onChange={(e) => setPerNameContenthash(name, e.target.value)}
                              placeholder={sharedRecords.contenthash || 'ipfs://... (override)'}
                              labelClassName='w-[140px]! text-nowrap'
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className='border-tertiary flex flex-col gap-2 border-t p-4 sm:px-6'>
              {managedNames.length === 0 && (
                <div className='bg-grace/10 border-tertiary rounded-md border p-3'>
                  <p className='text-grace text-md'>
                    You are not the manager of any of the selected names. No records can be updated.
                  </p>
                </div>
              )}
              <PrimaryButton
                className='w-full'
                onClick={saveRecords}
                disabled={!hasChanges || managedNames.length === 0}
              >
                Save Records for {managedNames.length} Name{managedNames.length !== 1 ? 's' : ''}
              </PrimaryButton>
              <SecondaryButton className='w-full' onClick={handleClose}>
                Close
              </SecondaryButton>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default BulkEditRecordsModal
