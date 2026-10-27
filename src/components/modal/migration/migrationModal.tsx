'use client'

import { ReviewSkeleton, RecordListSkeleton } from '@/components/ui/ensSkeletons'
import { SkeletonText } from '@/components/ui/loadingSkeleton'

import { useEffect, useRef, useState } from 'react'
import { activeChain } from '@/constants/web3/chain'
import { SettingsTransactionProvider } from '@/context/settingsTransaction'
import { useMigration, type MigrationRecordMode } from '@/hooks/migration/useMigration'
import { roleErrorText } from '@/hooks/records/useV2Roles'
import { recordLabel } from '@/utils/records/v2Records'
import Input from '@/components/ui/input'
import Dropdown from '@/components/ui/dropdown'
import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'
import ModalShell, { modalActionClassName, modalPrimaryActionClassName } from '@/components/ui/modal/modalShell'
import DiscardChangesModal from '@/components/modal/records/components/discardChangesModal'
import { MIGRATION_TITLE, MigrationSubject, migrationTransactionScreen } from './migrationScreens'
import { useConfigurationPreferences } from '@/hooks/settings/useResolverPreferences'
import { configurationName, resolverDefaultName } from '@/utils/settings/labels'
import { isAddress } from 'viem'

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
  const preferences = useConfigurationPreferences(
    isAddress(migration.resolverValue, { strict: false }) ? migration.resolverValue : undefined,
    migration.mode === 'existing'
  )
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
  const resolverLabel = migration.directory.resolvers.find(
    (item) => item.address.toLowerCase() === migration.resolverValue.toLowerCase()
  )?.name
  const count = migration.catalog.data?.recordCount ?? BigInt(0)
  const options = [
    {
      label: resolverDefaultName(preferences.data, migration.catalog.data?.defaultRecordId),
      value: '0',
    },
    ...Array.from({ length: Number(count > BigInt(1000) ? BigInt(1000) : count) }, (_, index) => ({
      label: configurationName(preferences.data, `${index + 1}`),
      value: `${index + 1}`,
    })),
  ]
  if (/^\d+$/.test(migration.configuration) && BigInt(migration.configuration) > BigInt(1000))
    options.push({
      label: configurationName(preferences.data, migration.configuration),
      value: migration.configuration,
    })
  const error = migration.deployment.error ?? migration.eligibility.error
  const busy = migration.deployment.isLoading || migration.eligibility.isLoading

  // The queue's busy, success and error screens replace the form inside this modal, so nothing stacks on top of it.
  const screen = migrationTransactionScreen({
    name,
    view: transaction.phase === 'idle' ? null : { ...transaction, phase: transaction.phase },
    migrated: migration.migrated,
    complete: migration.complete,
    restoresRecords: !!info?.replacesResolver && migration.mode === 'copy',
    canOpenRecords: info?.fixedResolver === null && migration.mode !== 'none',
    onRetry: () => void transaction.run(),
    onReset: transaction.reset,
    onFinishRecords: () => void migration.finishRecords(),
    onClose: close,
    onOpenRecords: onComplete,
  })

  const review = (
    <>
      {busy ? (
        <ReviewSkeleton label='Checking ownership and migration requirements…' />
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
              void (migration.deployment.isError ? migration.deployment.refetch() : migration.eligibility.refetch())
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
                {resolverLabel && <p className='text-neutral text-lg'>{resolverLabel}</p>}
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
                  <SkeletonText label='Checking resolver permissions…' className='w-48' />
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
                  <RecordListSkeleton label='Discovering record keys and reading their current values…' />
                )}
                {migration.source.isError && (
                  <div role='alert' className='flex flex-col gap-2'>
                    <p className='text-sm text-red-400'>
                      Could not read all detected records. Migration with record copying is blocked until this succeeds.
                    </p>
                    <p className='text-neutral text-sm wrap-break-word'>{roleErrorText(migration.source.error)}</p>
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
                  Review this list. Custom offchain resolver behavior and records without discoverable keys cannot be
                  copied automatically.
                </p>
              </div>
            )}
            {migration.mode === 'empty' && (
              <p className='text-grace text-md'>
                A new empty configuration will be created. Existing addresses and profile records will not be copied and
                will stop resolving until you add them again.
              </p>
            )}
            {migration.mode === 'none' && (
              <p className='text-grace text-md'>
                Existing records will not be copied. No resolver will be assigned directly; subnames may inherit their
                parent’s resolver. Otherwise addresses and profile records will stop resolving.
              </p>
            )}
            <label className='text-md flex cursor-pointer items-center gap-2'>
              <input
                type='checkbox'
                className='accent-primary h-4 w-4 shrink-0 cursor-pointer'
                checked={migration.acknowledged}
                onChange={(event) => migration.setAcknowledged(event.target.checked)}
              />
              <span>I reviewed the records and understand that migration is permanent.</span>
            </label>
          </>
        )
      )}
    </>
  )

  return (
    <>
      <div
        ref={dialog}
        tabIndex={-1}
        className='outline-none'
        onKeyDown={(event) => {
          if (discard || event.key !== 'Tab') return
          const elements = Array.from(
            dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), a[href]') ?? []
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
        <ModalShell
          title={MIGRATION_TITLE}
          onClose={close}
          locked={screen?.locked}
          stageKey={screen?.key ?? 'review'}
          subject={screen ? screen.subject : <MigrationSubject name={name} migrated={migration.migrated} />}
          footerHint={screen?.footerHint}
          footer={
            screen ? (
              screen.footer
            ) : (
              <>
                <PrimaryButton
                  className={modalPrimaryActionClassName}
                  disabled={!migration.canMigrate}
                  onClick={() => void migration.migrate()}
                >
                  Migrate to ENS V2
                </PrimaryButton>
                <SecondaryButton className={modalActionClassName} onClick={close}>
                  Back to records
                </SecondaryButton>
              </>
            )
          }
        >
          {screen ? screen.content : review}
        </ModalShell>
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

// Inline: the migration modal renders the transaction screens itself instead of a second modal stacked over it.
const MigrationModal: React.FC<MigrationModalProps> = (props) => (
  <SettingsTransactionProvider inline>
    <MigrationForm {...props} />
  </SettingsTransactionProvider>
)

export default MigrationModal
