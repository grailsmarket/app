'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Cross } from 'ethereum-identity-kit'
import { activeChain } from '@/constants/web3/chain'
import { SettingsTransactionProvider } from '@/context/settingsTransaction'
import { useMigration, type MigrationRecordMode } from '@/hooks/migration/useMigration'
import { roleErrorText } from '@/hooks/records/useV2Roles'
import { recordLabel } from '@/utils/records/v2Records'
import NameImage from '@/components/ui/nameImage'
import Input from '@/components/ui/input'
import Dropdown from '@/components/ui/dropdown'
import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'
import DiscardChangesModal from '@/components/modal/records/components/discardChangesModal'

interface MigrationModalProps {
  name: string
  onBack: () => void
  onComplete: () => void
  onClose: () => void
}

interface MigrationReviewProps extends MigrationModalProps {
  migration: ReturnType<typeof useMigration>
}

export const MigrationReview: React.FC<MigrationReviewProps> = ({ name, onBack, onComplete, onClose, migration }) => {
  const { info, transaction } = migration
  const [discard, setDiscard] = useState(false)
  const [resolverFocused, setResolverFocused] = useState(false)
  const dialog = useRef<HTMLDivElement>(null)
  const dirty =
    !migration.complete &&
    (migration.acknowledged ||
      migration.mode !== 'copy' ||
      migration.configuration !== '0' ||
      migration.resolverValue !== (migration.directory.predicted.data || '') ||
      migration.migrated)
  const leave = () => (migration.migrated ? onClose() : onBack())
  const close = () => {
    if (transaction.busy || transaction.submitted) return
    if (migration.complete) onClose()
    else if (dirty) setDiscard(true)
    else leave()
  }

  useEffect(() => {
    const previous = document.activeElement
    const overflow = document.body.style.overflow

    document.body.style.overflow = 'hidden'
    dialog.current?.focus()

    return () => {
      document.body.style.overflow = overflow
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus()
    }
  }, [])

  useEffect(() => {
    if (!dirty && !transaction.busy && !transaction.submitted) return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty, transaction.busy, transaction.submitted])

  const suggestions = migration.directory.resolvers.filter((item) =>
    `${item.address} ${item.name ?? ''}`.toLowerCase().includes(migration.resolverValue.toLowerCase())
  )
  const count = migration.catalog.data?.recordCount ?? BigInt(0)
  const options = [
    {
      label: `Resolver default${migration.catalog.data?.defaultRecordId ? ` · ID ${migration.catalog.data.defaultRecordId}` : ' · empty'}`,
      value: '0',
    },
    ...Array.from({ length: Number(count > BigInt(1000) ? BigInt(1000) : count) }, (_, index) => ({
      label: `Configuration ${index + 1}`,
      value: `${index + 1}`,
    })),
  ]
  if (/^\d+$/.test(migration.configuration) && BigInt(migration.configuration) > BigInt(1000))
    options.push({ label: `Configuration ${migration.configuration}`, value: migration.configuration })
  const error = migration.deployment.error ?? migration.eligibility.error
  const busy = migration.deployment.isLoading || migration.eligibility.isLoading

  return (
    <>
      <div
        className='fixed inset-0 z-100 flex h-dvh items-end justify-center bg-black/40 backdrop-blur-sm md:items-center md:p-4'
        onClick={(event) => {
          event.stopPropagation()
          close()
        }}
      >
        <div
          ref={dialog}
          role='dialog'
          aria-modal='true'
          aria-labelledby='migration-title'
          tabIndex={-1}
          className='bg-background border-tertiary flex h-[calc(100dvh-56px)] w-full flex-col overflow-hidden rounded-md border-t shadow-lg outline-none md:max-h-200 md:max-w-xl md:border-2'
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => {
            if (discard || transaction.phase !== 'idle') return
            if (event.key === 'Escape' && !event.defaultPrevented) {
              event.preventDefault()
              close()
            }
            if (event.key !== 'Tab') return
            const elements = Array.from(
              dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), a[href]') ??
                []
            ).filter((element) => element.getClientRects().length)
            const first = elements[0]
            const last = elements.at(-1)

            if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) {
              event.preventDefault()
              last?.focus()
            } else if (!event.shiftKey && document.activeElement === last) {
              event.preventDefault()
              first?.focus()
            }
          }}
        >
          <div className='border-tertiary flex shrink-0 items-center justify-between gap-3 border-b px-4 py-3 sm:px-6'>
            <h2 id='migration-title' className='text-xl font-bold'>
              Migrate to ENS V2
            </h2>
            <button
              type='button'
              aria-label='Close migration'
              onClick={close}
              className='hover:bg-secondary cursor-pointer rounded-md p-1'
            >
              <Cross className='h-3.5 w-3.5' />
            </button>
          </div>

          <div className='flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain p-4 sm:p-6'>
            <div className='flex items-center gap-3'>
              <NameImage
                name={name}
                tokenId=''
                version={migration.migrated ? 2 : 1}
                expiryDate={null}
                forceRegStatus='Registered'
                width={40}
                height={40}
              />
              <div className='min-w-0'>
                <p className='truncate text-xl font-semibold'>{name}</p>
                <p className='text-neutral text-sm'>{activeChain.name} · ENS V1 → V2</p>
              </div>
            </div>

            {migration.complete ? (
              <div className='flex flex-1 flex-col items-center justify-center gap-4 py-8 text-center'>
                <div className='bg-primary rounded-full p-2'>
                  <Check className='text-background h-6 w-6' />
                </div>
                <p className='text-xl font-semibold'>Migration complete</p>
                <p className='text-neutral text-lg'>
                  Your name is now managed through ENS V2. Your wallet remains its owner.
                </p>
              </div>
            ) : migration.migrated ? (
              <div className='bg-secondary border-tertiary rounded-md border p-4 text-lg'>
                <p className='font-semibold'>Your name has migrated</p>
                <p className='text-neutral mt-2'>
                  The records still need to be restored in PublicResolverV2. Keep this window open to finish the
                  remaining transaction. Retrying will not migrate your name again.
                </p>
              </div>
            ) : busy ? (
              <p className='text-neutral py-6 text-center text-lg'>Checking ownership and migration requirements…</p>
            ) : !migration.address ? (
              <p className='text-neutral text-lg'>Connect the wallet that owns this name to check migration.</p>
            ) : error ? (
              <div role='alert' className='border-tertiary bg-secondary flex flex-col gap-3 rounded-md border p-4'>
                <p className='text-lg'>{roleErrorText(error)}</p>
                <p className='text-neutral text-sm'>
                  Migration must happen on the same network as the V1 token. This deployment uses {activeChain.name}.
                </p>
                <SecondaryButton
                  onClick={() =>
                    void (migration.deployment.isError
                      ? migration.deployment.refetch()
                      : migration.eligibility.refetch())
                  }
                >
                  Check again
                </SecondaryButton>
              </div>
            ) : (
              info && (
                <>
                  <div className='bg-secondary border-tertiary flex flex-col gap-2 rounded-md border p-4'>
                    <p className='text-lg font-semibold'>
                      {info.locked ? 'Locked wrapped name' : info.wrapped ? 'Wrapped name' : 'Unwrapped name'}
                    </p>
                    <p className='text-neutral text-md'>
                      Your wallet stays the owner. Migration permanently retires the V1 token; it cannot be moved back.
                    </p>
                    <p className='text-neutral text-md'>
                      Subnames migrate separately. Existing managers, resolver delegates, and token approvals are not
                      automatically copied.
                    </p>
                    {info.locked && (
                      <p className='text-neutral text-md'>
                        Burned fuse restrictions become V2 permissions. A subregistry is created automatically.
                      </p>
                    )}
                  </div>

                  {info.fixedResolver !== null ? (
                    <div className='border-tertiary rounded-md border p-4'>
                      <p className='text-lg font-semibold'>Resolver locked</p>
                      <p className='text-neutral text-md mt-1'>
                        {info.replacesResolver
                          ? 'ENS replaces this Public Resolver with PublicResolverV2. Records are copied in a separate transaction after migration.'
                          : 'This name must keep its current resolver. Its existing records remain there.'}
                      </p>
                      <p className='text-neutral mt-2 text-sm break-all'>{info.fixedResolver}</p>
                    </div>
                  ) : (
                    <Dropdown
                      label='Records'
                      value={migration.mode}
                      onSelect={(value) => migration.setMode(value as MigrationRecordMode)}
                      options={[
                        { label: 'Copy existing records', value: 'copy' },
                        { label: 'Use an existing configuration', value: 'existing' },
                        { label: 'Create an empty configuration', value: 'empty' },
                        { label: 'Set up records later', value: 'none' },
                      ]}
                    />
                  )}

                  {info.fixedResolver === null && migration.mode !== 'none' && (
                    <div className='flex flex-col gap-2'>
                      <Input
                        label='Resolver'
                        value={migration.resolverValue}
                        placeholder='Leave empty to deploy a resolver'
                        autoComplete='off'
                        spellCheck={false}
                        onFocus={() => setResolverFocused(true)}
                        onBlur={() => setResolverFocused(false)}
                        onChange={(event) => {
                          migration.setResolverInput(event.target.value.trim())
                          migration.setConfiguration('0')
                        }}
                      />
                      {resolverFocused && suggestions.length > 0 && (
                        <div className='border-tertiary bg-secondary max-h-40 overflow-y-auto rounded-md border'>
                          {suggestions.map((item) => (
                            <button
                              key={item.address}
                              type='button'
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => {
                                migration.setResolverInput(item.address)
                                migration.setConfiguration('0')
                                setResolverFocused(false)
                              }}
                              className='hover:bg-tertiary border-tertiary flex w-full cursor-pointer flex-col border-b px-3 py-2 text-left last:border-b-0'
                            >
                              {item.name && <span>{item.name}</span>}
                              <span className='text-sm break-all'>{item.address}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      <p className='text-neutral text-sm'>
                        {migration.mode === 'existing'
                          ? 'Choose a resolver and configuration you can link. Future edits to that configuration also affect this name.'
                          : 'A new configuration will use this resolver’s permissions. Leave the resolver empty to deploy one first.'}
                      </p>
                      {migration.catalog.isLoading && (
                        <p className='text-neutral text-sm'>Checking resolver permissions…</p>
                      )}
                      {migration.catalog.isError && (
                        <p className='text-sm text-red-400'>{roleErrorText(migration.catalog.error)}</p>
                      )}
                      {migration.mode === 'existing' && migration.catalog.data && (
                        <>
                          <Dropdown
                            label='Configuration'
                            value={migration.configuration}
                            onSelect={(value) => migration.setConfiguration(String(value))}
                            options={options}
                          />
                          {count > BigInt(1000) && (
                            <Input
                              label='Record ID'
                              value={migration.configuration}
                              onChange={(event) => migration.setConfiguration(event.target.value)}
                              inputMode='numeric'
                            />
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {migration.copies && (
                    <div className='flex flex-col gap-2'>
                      <div className='flex items-center justify-between gap-3'>
                        <p className='text-lg font-semibold'>
                          Records to copy{migration.source.data ? ` (${migration.source.data.length})` : ''}
                        </p>
                        {migration.source.isSuccess && (
                          <button
                            type='button'
                            className='text-primary cursor-pointer text-sm disabled:cursor-default disabled:opacity-50'
                            disabled={migration.source.isFetching}
                            onClick={() => void migration.source.refetch()}
                          >
                            {migration.source.isFetching ? 'Refreshing…' : 'Refresh'}
                          </button>
                        )}
                      </div>
                      {migration.source.isLoading && (
                        <p className='text-neutral text-sm'>
                          Discovering record keys and reading their current values…
                        </p>
                      )}
                      {migration.source.isError && (
                        <div role='alert' className='flex flex-col gap-2'>
                          <p className='text-sm text-red-400'>
                            Could not read all detected records. Migration with record copying is blocked until this
                            succeeds.
                          </p>
                          <p className='text-neutral text-sm wrap-break-word'>
                            {roleErrorText(migration.source.error)}
                          </p>
                          <SecondaryButton onClick={() => migration.source.refetch()}>Retry records</SecondaryButton>
                        </div>
                      )}
                      {migration.source.data && (
                        <div className='border-tertiary max-h-52 overflow-y-auto rounded-md border'>
                          {migration.source.data.length ? (
                            migration.source.data.map((record) => (
                              <div
                                key={`${record.kind}:${record.key}`}
                                className='border-tertiary border-b px-3 py-2 last:border-b-0'
                              >
                                <p className='text-md font-semibold'>{recordLabel(record)}</p>
                                <p className='text-neutral text-sm break-all'>{record.value}</p>
                              </div>
                            ))
                          ) : (
                            <p className='text-neutral p-3 text-sm'>
                              No records found to copy. A new configuration, if created, will be empty.
                            </p>
                          )}
                        </div>
                      )}
                      <p className='text-neutral text-sm'>
                        Review this list. Custom offchain resolver behavior and records without discoverable keys cannot
                        be copied automatically.
                      </p>
                    </div>
                  )}
                  {migration.mode === 'empty' && (
                    <p className='text-grace text-md'>
                      A new empty configuration will be created. Existing addresses and profile records will not be
                      copied and will stop resolving until you add them again.
                    </p>
                  )}
                  {migration.mode === 'none' && (
                    <p className='text-grace text-md'>
                      Existing records will not be copied. No resolver will be assigned directly; subnames may inherit
                      their parent’s resolver. Otherwise addresses and profile records will stop resolving.
                    </p>
                  )}
                  <label className='text-md flex cursor-pointer items-center gap-2'>
                    <input
                      type='checkbox'
                      className='accent-primary h-4 w-4 shrink-0 cursor-pointer'
                      checked={migration.acknowledged}
                      onChange={(event) => migration.setAcknowledged(event.target.checked)}
                    />
                    <span>I have reviewed the records and understand that migration is permanent.</span>
                  </label>
                </>
              )
            )}
          </div>

          <div className='border-tertiary flex shrink-0 flex-col gap-2 border-t p-4 sm:px-6'>
            {migration.complete ? (
              info?.fixedResolver === null &&
              migration.mode !== 'none' && (
                <PrimaryButton className='w-full' onClick={onComplete}>
                  Open V2 records
                </PrimaryButton>
              )
            ) : migration.migrated ? (
              <PrimaryButton className='w-full' onClick={() => void migration.finishRecords()}>
                Finish copying records
              </PrimaryButton>
            ) : (
              <PrimaryButton
                className='w-full'
                disabled={!migration.canMigrate}
                onClick={() => void migration.migrate()}
              >
                Migrate to ENS V2
              </PrimaryButton>
            )}
            <SecondaryButton className='w-full' onClick={close}>
              {migration.complete ? 'Close' : 'Back to records'}
            </SecondaryButton>
          </div>
        </div>
      </div>
      {discard && (
        <DiscardChangesModal
          onCancel={() => setDiscard(false)}
          onDiscard={leave}
          pendingTransaction={migration.migrated}
          description={
            migration.migrated
              ? 'Your name has already migrated. Closing discards the remaining record-copy work in this window. Those records will need to be restored separately; the migration cannot be undone.'
              : undefined
          }
        />
      )}
    </>
  )
}

const MigrationForm: React.FC<MigrationModalProps> = (props) => {
  const migration = useMigration(props.name)

  return <MigrationReview {...props} migration={migration} />
}

const MigrationModal: React.FC<MigrationModalProps> = (props) => (
  <SettingsTransactionProvider>
    <MigrationForm {...props} />
  </SettingsTransactionProvider>
)

export default MigrationModal
