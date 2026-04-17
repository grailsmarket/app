'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { Check } from 'ethereum-identity-kit'
import Input from '@/components/ui/input'
import Textarea from '@/components/ui/textarea'
import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'
import PlusIcon from 'public/icons/plus.svg'
import CrossIcon from 'public/icons/cross.svg'
import ArrowDownIcon from 'public/icons/arrow-down.svg'
import { useClickAway } from '@/hooks/useClickAway'
import { cn } from '@/utils/tailwind'
import { beautifyName } from '@/lib/ens'
import { useBulkEditRecords } from '@/hooks/records/useBulkEditRecords'
import { ADDRESS_RECORD_KEYS } from '@/constants/ens/records'
import ImageUploadModal from './components/imageUploadModal'
import { ADDRESS_LABELS, SOCIAL_RECORDS } from '@/constants/ens/records'
import TransactionStatusRow from './components/TransactionStatusRow'
import TabSelector from '@/components/ui/tabSelector'

interface BulkEditRecordsModalProps {
  names: string[]
  onClose: () => void
}

const BulkEditRecordsModal: React.FC<BulkEditRecordsModalProps> = ({ names, onClose }) => {
  const {
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
    perNameOverrides,
    setPerNameTextRecord,
    setPerNameEthAddress,
    setPerNameContenthash,
    setPerNameCustomRecord,
    perNameCustomKeys,
    addPerNameCustomKey,
    removePerNameCustomKey,
    resetPerNameOverrides,
    setPerNameAddressRecord,
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
  const [addingCustomKeyForName, setAddingCustomKeyForName] = useState<string | null>(null)
  const [perNameCustomKeyInput, setPerNameCustomKeyInput] = useState('')
  const [expandedNames, setExpandedNames] = useState<Set<string>>(new Set())
  const [showSkippedNames, setShowSkippedNames] = useState(false)

  const [imageUploadName, setImageUploadName] = useState<string | 'all' | null>(null)
  const [imageUploadTarget, setImageUploadTarget] = useState<'avatar' | 'header' | null>(null)

  const handleImageSave = (url: string) => {
    if (imageUploadTarget && imageUploadName) {
      if (imageUploadName === 'all') {
        setSharedTextRecord(imageUploadTarget, url)
      } else {
        setPerNameTextRecord(imageUploadName, imageUploadTarget, url)
      }

      setImageUploadTarget(null)
      setImageUploadName(null)
    }
  }

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
                <SecondaryButton
                  className='w-full'
                  onClick={() => {
                    onClose()
                    resetToEditing()
                    // dispatch(clearBulkSelect())
                  }}
                >
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
                            {group.resolverAddress.slice(0, 8)}...{group.resolverAddress.slice(-4)}:{' '}
                            {group.names.length} name{group.names.length !== 1 ? 's' : ''}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Mode toggle */}
                <div className='flex gap-2 px-4 sm:px-6'>
                  <TabSelector
                    tabs={[
                      { label: 'Apply to All', value: 'shared' },
                      { label: 'Per Name', value: 'per-name' },
                    ]}
                    selectedTab={editMode}
                    setSelectedTab={(tab) => setEditMode(tab as 'shared' | 'per-name')}
                  />
                </div>

                {/* Shared mode */}
                {editMode === 'shared' && (
                  <>
                    <div className='flex flex-col gap-3 px-4 sm:px-6'>
                      <div className='border-tertiary flex flex-col gap-2 border-b-2 pb-3'>
                        <h4 className='text-xl font-semibold'>Set Header and Avatar for all names</h4>
                        <div className='flex h-fit gap-2'>
                          <div
                            className='border-tertiary relative aspect-square w-1/3 cursor-pointer rounded-md border'
                            onClick={() => {
                              setImageUploadTarget('avatar')
                              setImageUploadName('all')
                            }}
                          >
                            {sharedRecords.textRecords.avatar ? (
                              <Image
                                src={sharedRecords.textRecords.avatar}
                                alt='Avatar'
                                width={100}
                                height={100}
                                className='aspect-square w-full rounded-md object-cover'
                              />
                            ) : (
                              <div className='bg-secondary hover:bg-tertiary flex aspect-square w-full items-center justify-center rounded-md'>
                                <p className='text-neutral text-lg'>Click to set avatar</p>
                              </div>
                            )}
                            {sharedRecords.textRecords.avatar && (
                              <button
                                className='bg-secondary/70 hover:bg-tertiary/80 absolute top-2 right-2 flex h-6 w-6 cursor-pointer items-center justify-center rounded-sm transition-colors'
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setImageUploadTarget(null)
                                  setSharedTextRecord('avatar', '')
                                }}
                              >
                                <Image src={CrossIcon} alt='Remove' width={14} height={14} />
                              </button>
                            )}
                          </div>
                          <div
                            className='border-tertiary relative w-2/3 cursor-pointer overflow-hidden rounded-md border'
                            onClick={() => {
                              setImageUploadTarget('header')
                              setImageUploadName('all')
                            }}
                          >
                            {sharedRecords.textRecords.header ? (
                              <Image
                                src={sharedRecords.textRecords.header}
                                alt='Header'
                                width={300}
                                height={100}
                                className='aspect-2/1 w-full rounded-md object-cover'
                              />
                            ) : (
                              <div className='bg-secondary hover:bg-tertiary flex h-full w-full items-center justify-center rounded-md'>
                                <p className='text-neutral text-lg'>Click to set header</p>
                              </div>
                            )}
                            {sharedRecords.textRecords.header && (
                              <button
                                className='bg-secondary/70 hover:bg-tertiary/80 absolute top-2 right-2 flex h-6 w-6 cursor-pointer items-center justify-center rounded-sm transition-colors'
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setImageUploadTarget(null)
                                  setSharedTextRecord('header', '')
                                }}
                              >
                                <Image src={CrossIcon} alt='Remove' width={14} height={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      <Input
                        label='Ethereum'
                        value={sharedRecords.ethAddress}
                        onChange={(e) => {
                          if (e.target.value.includes(' ')) return
                          setSharedEthAddress(e.target.value)
                        }}
                        placeholder='0x... address for all names'
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
                      <Input
                        label='Contenthash'
                        value={sharedRecords.contenthash}
                        onChange={(e) => setSharedContenthash(e.target.value)}
                        placeholder='ipfs://... or ar://...'
                        labelClassName='w-[140px]! text-nowrap'
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
                    {Object.keys(sharedRecords.addressRecords).length > 0 && (
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
                    )}

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
                          {ADDRESS_RECORD_KEYS.filter((key) => sharedRecords.addressRecords[key] === undefined).map(
                            (key) => (
                              <button
                                key={key}
                                className='hover:bg-tertiary px-4 py-2 text-left text-lg font-medium transition-colors'
                                onClick={() => {
                                  setSharedAddressRecord(key, '')
                                  setAddRecordOpen(false)
                                }}
                              >
                                {ADDRESS_LABELS[key] || key.toUpperCase()}
                              </button>
                            )
                          )}
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
                              className='hover:bg-tertiary rounded-md px-4 py-2 text-left text-lg font-medium transition-colors'
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
                      const hasOverride =
                        override &&
                        Object.keys(override).some((k) => {
                          const sharedValue = sharedRecords[k as keyof typeof sharedRecords]
                          const val = override[k as keyof typeof override]
                          if (typeof val === 'string') return val !== sharedValue
                          if (typeof val === 'object' && val)
                            return Object.values(val).some((v) => !!v && v !== sharedValue)
                          return false
                        })
                      const avatarRecord = effective.textRecords['avatar']
                      const headerRecord = effective.textRecords['header']

                      return (
                        <div key={name} className='border-tertiary rounded-md border'>
                          <button
                            className='hover:bg-tertiary/60 flex w-full cursor-pointer items-center justify-between p-3 transition-colors'
                            onClick={() => toggleExpandedName(name)}
                          >
                            <div className='flex items-center gap-2'>
                              <p className='text-lg font-semibold'>{beautifyName(name)}</p>
                              {hasOverride && (
                                <span className='bg-primary/20 text-primary rounded px-1.5 py-0.5 text-sm font-medium'>
                                  Changed
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
                              {hasOverride && (
                                <button
                                  className='text-neutral hover:text-foreground hover:border-foreground border-tertiary text-md w-full cursor-pointer rounded-md border p-2 font-medium transition-colors'
                                  onClick={() => resetPerNameOverrides(name)}
                                >
                                  Reset changes
                                </button>
                              )}
                              <div className='flex h-fit gap-2'>
                                <div
                                  className='border-tertiary relative aspect-square w-1/3 cursor-pointer rounded-md border'
                                  onClick={() => {
                                    setImageUploadTarget('avatar')
                                    setImageUploadName(name)
                                  }}
                                >
                                  {avatarRecord ? (
                                    <Image
                                      src={avatarRecord}
                                      alt='Avatar'
                                      width={100}
                                      height={100}
                                      className='aspect-square w-full rounded-md object-cover'
                                    />
                                  ) : (
                                    <div className='bg-secondary hover:bg-tertiary flex aspect-square w-full items-center justify-center rounded-md'>
                                      <p className='text-neutral text-lg'>Click to set avatar</p>
                                    </div>
                                  )}
                                  {avatarRecord && (
                                    <button
                                      className='bg-secondary/70 hover:bg-tertiary/80 absolute top-2 right-2 flex h-6 w-6 cursor-pointer items-center justify-center rounded-sm transition-colors'
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setImageUploadTarget(null)
                                        setPerNameTextRecord(name, 'avatar', '')
                                      }}
                                    >
                                      <Image src={CrossIcon} alt='Remove' width={14} height={14} />
                                    </button>
                                  )}
                                </div>
                                <div
                                  className='border-tertiary relative w-2/3 cursor-pointer overflow-hidden rounded-md border'
                                  onClick={() => {
                                    setImageUploadTarget('header')
                                    setImageUploadName(name)
                                  }}
                                >
                                  {headerRecord ? (
                                    <Image
                                      src={headerRecord}
                                      alt='Header'
                                      width={300}
                                      height={100}
                                      className='aspect-2/1 w-full rounded-md object-cover'
                                    />
                                  ) : (
                                    <div className='bg-secondary hover:bg-tertiary flex h-full w-full items-center justify-center rounded-md'>
                                      <p className='text-neutral text-lg'>Click to set header</p>
                                    </div>
                                  )}
                                  {headerRecord && (
                                    <button
                                      className='bg-secondary/70 hover:bg-tertiary/80 absolute top-2 right-2 flex h-6 w-6 cursor-pointer items-center justify-center rounded-sm transition-colors'
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setImageUploadTarget(null)
                                        setPerNameTextRecord(name, 'header', '')
                                      }}
                                    >
                                      <Image src={CrossIcon} alt='Remove' width={14} height={14} />
                                    </button>
                                  )}
                                </div>
                              </div>
                              <Input
                                label='Ethereum'
                                value={override?.ethAddress ?? sharedRecords.ethAddress ?? ''}
                                onChange={(e) => {
                                  if (e.target.value.includes(' ')) return
                                  setPerNameEthAddress(name, e.target.value)
                                }}
                                placeholder={'Address or ENS name'}
                              />
                              <Input
                                label='Short Bio'
                                value={
                                  override?.textRecords?.description ?? sharedRecords.textRecords.description ?? ''
                                }
                                onChange={(e) => setPerNameTextRecord(name, 'description', e.target.value)}
                                placeholder={'Description'}
                              />
                              <Input
                                label='Location'
                                value={override?.textRecords?.location ?? sharedRecords.textRecords.location ?? ''}
                                onChange={(e) => setPerNameTextRecord(name, 'location', e.target.value)}
                                placeholder='Where are you based?'
                              />
                              <Input
                                label='Website'
                                value={override?.textRecords?.url ?? sharedRecords.textRecords.url ?? ''}
                                onChange={(e) => setPerNameTextRecord(name, 'url', e.target.value)}
                                placeholder={'Website URL'}
                              />
                              <Input
                                label='Email'
                                value={override?.textRecords?.email ?? sharedRecords.textRecords.email ?? ''}
                                onChange={(e) => setPerNameTextRecord(name, 'email', e.target.value)}
                                placeholder='you@example.com'
                              />
                              <Input
                                label='Contenthash'
                                value={override?.contenthash ?? sharedRecords.contenthash ?? ''}
                                onChange={(e) => setPerNameContenthash(name, e.target.value)}
                                placeholder={'ipfs://... or ar://...'}
                                labelClassName='w-[140px]! text-nowrap'
                              />
                              {/* Socials */}
                              <div className='grid grid-cols-2 gap-3'>
                                {SOCIAL_RECORDS.map((social) => (
                                  <div key={social.key} className='flex'>
                                    <div className='bg-background border-tertiary flex h-12 min-w-[48px] items-center justify-center rounded-l-md border border-r-0'>
                                      <Image src={social.icon} alt={social.label} width={20} height={20} />
                                    </div>
                                    <input
                                      type='text'
                                      value={
                                        override?.textRecords?.[social.key] ??
                                        sharedRecords.textRecords[social.key] ??
                                        ''
                                      }
                                      onChange={(e) => setPerNameTextRecord(name, social.key, e.target.value)}
                                      className='bg-secondary border-tertiary hover:bg-tertiary focus:bg-tertiary flex h-12 w-full items-center rounded-r-md border px-3 py-2 text-left transition-colors hover:border-white/70 focus:border-white/70 focus:outline-none'
                                      placeholder={social.placeholder}
                                    />
                                  </div>
                                ))}
                              </div>

                              {/* Address records */}
                              <div className='flex flex-col gap-3'>
                                <h3 className='text-neutral text-lg font-semibold'>Address Records</h3>
                                {ADDRESS_RECORD_KEYS.map((key) => (
                                  <Input
                                    key={key}
                                    label={ADDRESS_LABELS[key] || key.toUpperCase()}
                                    value={override?.addressRecords?.[key] ?? sharedRecords.addressRecords[key] ?? ''}
                                    onChange={(e) => setPerNameAddressRecord(name, key, e.target.value)}
                                    placeholder={`${ADDRESS_LABELS[key] || key.toUpperCase()} address`}
                                  />
                                ))}
                              </div>

                              {/* Custom records (shared + per-name) */}
                              {(() => {
                                const nameOnlyKeys = (perNameCustomKeys.get(name) || []).filter(
                                  (k) => !customRecordKeys.includes(k)
                                )
                                const visibleSharedKeys = customRecordKeys.filter((key) => {
                                  const perNameValue = override?.customRecords?.[key]
                                  const sharedValue = sharedRecords.customRecords[key] ?? ''
                                  return !(perNameValue === '' && sharedValue !== '')
                                })
                                const hasAnyCustom = visibleSharedKeys.length > 0 || nameOnlyKeys.length > 0

                                return (
                                  <div className='flex flex-col gap-3'>
                                    {hasAnyCustom && (
                                      <h3 className='text-neutral text-lg font-semibold'>Custom Records</h3>
                                    )}

                                    {/* Shared custom records (hidden when removed for this name) */}
                                    {customRecordKeys.map((key) => {
                                      const perNameValue = override?.customRecords?.[key]
                                      const sharedValue = sharedRecords.customRecords[key] ?? ''
                                      const isRemoved = perNameValue === '' && sharedValue !== ''

                                      if (isRemoved) return null

                                      return (
                                        <div key={key} className='flex items-center gap-1'>
                                          <Input
                                            label={key}
                                            value={perNameValue ?? sharedValue}
                                            onChange={(e) => setPerNameCustomRecord(name, key, e.target.value)}
                                            placeholder={`Value for ${key}`}
                                            className='flex-1'
                                            labelClassName='w-[128px] max-w-[128px] break-all block py-3'
                                          />
                                          {(perNameValue ?? sharedValue) ? (
                                            <button
                                              className='hover:bg-tertiary flex h-12 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors'
                                              onClick={() => setPerNameCustomRecord(name, key, '')}
                                              title='Remove for this name'
                                            >
                                              <Image src={CrossIcon} alt='Remove' width={14} height={14} />
                                            </button>
                                          ) : (
                                            <div className='w-8 flex-shrink-0' />
                                          )}
                                        </div>
                                      )
                                    })}

                                    {/* Per-name-only custom records */}
                                    {nameOnlyKeys.map((key) => (
                                      <div key={key} className='flex items-center gap-1'>
                                        <Input
                                          label={key}
                                          value={override?.customRecords?.[key] ?? ''}
                                          onChange={(e) => setPerNameCustomRecord(name, key, e.target.value)}
                                          placeholder={`Value for ${key}`}
                                          className='flex-1'
                                          labelClassName='w-[128px] max-w-[128px] break-all block py-3'
                                        />
                                        <button
                                          className='hover:bg-tertiary flex h-12 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors'
                                          onClick={() => removePerNameCustomKey(name, key)}
                                          title='Remove custom record'
                                        >
                                          <Image src={CrossIcon} alt='Remove' width={14} height={14} />
                                        </button>
                                      </div>
                                    ))}

                                    {/* Add custom record */}
                                    {addingCustomKeyForName === name ? (
                                      <div className='flex items-center gap-1'>
                                        <input
                                          type='text'
                                          value={perNameCustomKeyInput}
                                          onChange={(e) => setPerNameCustomKeyInput(e.target.value)}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter' && perNameCustomKeyInput.trim()) {
                                              const trimmed = perNameCustomKeyInput.trim()
                                              // If it's a removed shared key, restore it
                                              if (customRecordKeys.includes(trimmed)) {
                                                setPerNameCustomRecord(
                                                  name,
                                                  trimmed,
                                                  sharedRecords.customRecords[trimmed] ?? ''
                                                )
                                              } else {
                                                addPerNameCustomKey(name, trimmed)
                                              }
                                              setPerNameCustomKeyInput('')
                                              setAddingCustomKeyForName(null)
                                            }
                                            if (e.key === 'Escape') {
                                              setPerNameCustomKeyInput('')
                                              setAddingCustomKeyForName(null)
                                            }
                                          }}
                                          className='bg-tertiary flex-1 rounded-md px-3 py-2 text-lg font-semibold focus:outline-none'
                                          placeholder='Record key...'
                                          autoFocus
                                        />
                                        <button
                                          className='bg-primary text-background rounded-md px-3 py-2 text-lg font-semibold disabled:opacity-50'
                                          disabled={!perNameCustomKeyInput.trim()}
                                          onClick={() => {
                                            const trimmed = perNameCustomKeyInput.trim()
                                            if (trimmed) {
                                              if (customRecordKeys.includes(trimmed)) {
                                                setPerNameCustomRecord(
                                                  name,
                                                  trimmed,
                                                  sharedRecords.customRecords[trimmed] ?? ''
                                                )
                                              } else {
                                                addPerNameCustomKey(name, trimmed)
                                              }
                                              setPerNameCustomKeyInput('')
                                              setAddingCustomKeyForName(null)
                                            }
                                          }}
                                        >
                                          Add
                                        </button>
                                        <button
                                          className='hover:bg-tertiary rounded-md px-2 py-2 transition-colors'
                                          onClick={() => {
                                            setPerNameCustomKeyInput('')
                                            setAddingCustomKeyForName(null)
                                          }}
                                        >
                                          <Image src={CrossIcon} alt='Cancel' width={14} height={14} />
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        className='border-tertiary hover:bg-tertiary focus:bg-tertiary flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border-2 px-3 py-2 text-left transition-colors hover:border-white/70 focus:border-white/70 focus:outline-none'
                                        onClick={() => {
                                          setAddingCustomKeyForName(name)
                                          setPerNameCustomKeyInput('')
                                        }}
                                      >
                                        <Image src={PlusIcon} alt='Add' width={16} height={16} className='invert' />
                                        Add Custom Record
                                      </button>
                                    )}
                                  </div>
                                )
                              })()}
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
      {imageUploadTarget && imageUploadName && (
        <ImageUploadModal
          // for the combined image, upload to the name combined from all the selected names to prevent conflicts when changing individual ones
          name={
            imageUploadName === 'all'
              ? `${names.map((name) => name.replace('.eth', '').substring(0, 100)).join('-')}.eth`
              : imageUploadName
          }
          imageType={imageUploadTarget}
          currentValue={getEffectiveRecords(imageUploadName).textRecords[imageUploadTarget]}
          onSave={handleImageSave}
          onClose={() => setImageUploadTarget(null)}
        />
      )}
    </>
  )
}

export default BulkEditRecordsModal
