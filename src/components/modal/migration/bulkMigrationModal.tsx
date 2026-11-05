'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { isAddress } from 'viem'
import { SettingsTransactionProvider } from '@/context/settingsTransaction'
import { useBulkMigration } from '@/hooks/migration/useBulkMigration'
import type { MigrationRecordMode } from '@/hooks/migration/useMigration'
import { useConfigurationPreferences } from '@/hooks/settings/useResolverPreferences'
import { roleErrorText } from '@/hooks/records/useV2Roles'
import { configurationName, resolverDefaultName } from '@/utils/settings/labels'
import { recordLabel } from '@/utils/records/v2Records'
import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'
import Dropdown from '@/components/ui/dropdown'
import Input from '@/components/ui/input'
import { ReviewSkeleton } from '@/components/ui/ensSkeletons'
import { SkeletonText } from '@/components/ui/loadingSkeleton'
import ModalShell, { modalActionClassName, modalPrimaryActionClassName } from '@/components/ui/modal/modalShell'
import Notice from '@/components/ui/modal/notice'
import TxStatus from '@/components/ui/modal/txStatus'
import DiscardChangesModal from '@/components/modal/records/components/discardChangesModal'
import {
  KEEP_OPEN_HINT,
  TransactionFailure,
  TransactionLinks,
  TransactionProgress,
  TransactionUnconfirmed,
  confirmedTransactions,
  isWalletPrompt,
} from '@/components/settings/transactionScreens'

interface BulkMigrationModalProps {
  names: string[]
  onClose: () => void
}

const BulkMigrationForm = ({ names, onClose }: BulkMigrationModalProps) => {
  const migration = useBulkMigration(names)
  const { transaction, loading, source, catalog } = migration
  const eligible = loading.data?.names ?? []
  const excluded = loading.data?.errors ?? []
  const allMigrated = migration.migrated && migration.migratedCount === eligible.length
  const flexible = eligible.some((name) => name.fixedResolver === null)
  const copies = eligible.some(
    (name) => name.replacesResolver || (name.fixedResolver === null && migration.mode === 'copy')
  )
  const [discard, setDiscard] = useState(false)
  const dialog = useRef<HTMLDivElement>(null)
  const resolverListId = useId()
  const preferences = useConfigurationPreferences(
    isAddress(migration.resolverValue, { strict: false }) ? migration.resolverValue : undefined,
    flexible && migration.mode === 'existing'
  )
  const dirty =
    !migration.complete &&
    (migration.acknowledged ||
      migration.mode !== 'copy' ||
      migration.configuration !== '0' ||
      migration.resolverValue !== (migration.directory.predicted.data || '') ||
      transaction.pending)
  const locked = transaction.busy || transaction.submitted

  const close = () => {
    if (locked) return
    if (dirty) setDiscard(true)
    else onClose()
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
    if (!dirty && !locked) return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty, locked])

  const count = catalog.data?.recordCount ?? BigInt(0)
  const options = [
    { label: resolverDefaultName(preferences.data, catalog.data?.defaultRecordId), value: '0' },
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

  const error = migration.deployment.error ?? loading.error
  const view = transaction.phase === 'idle' ? null : { ...transaction, phase: transaction.phase }

  let content = (
    <>
      {migration.walletChanged ? (
        <Notice tone='warning'>Reconnect the wallet that opened this migration to continue.</Notice>
      ) : !migration.account ? (
        <p className='text-neutral text-lg'>Connect the wallet that owns these names to check migration.</p>
      ) : migration.deployment.isLoading || loading.isLoading ? (
        <ReviewSkeleton label='Checking ownership and migration requirements…' />
      ) : error ? (
        <>
          <Notice tone='danger'>{roleErrorText(error)}</Notice>
          <SecondaryButton
            onClick={() => void (migration.deployment.isError ? migration.deployment.refetch() : loading.refetch())}
          >
            Check again
          </SecondaryButton>
        </>
      ) : (
        <>
          {eligible.length > 0 && (
            <>
              <div className='bg-secondary border-tertiary flex flex-col gap-2 rounded-md border p-4'>
                <p className='text-lg font-semibold'>
                  {eligible.length} {eligible.length === 1 ? 'name' : 'names'} ready to migrate
                </p>
                <p className='text-neutral text-md'>
                  Your wallet stays the owner. Migration permanently retires these V1 tokens; they cannot be moved back.
                  Selected parents migrate before their subnames. Managers, resolver delegates, and token approvals are
                  not copied.
                </p>
                <p className='text-neutral text-sm'>
                  The migration helper may require approval to transfer all your tokens in the V1 registrar and
                  NameWrapper. Subnames under a parent in its grace period require separate transactions.
                </p>
              </div>
              {flexible && (
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
              {flexible && migration.mode !== 'none' && (
                <>
                  <Input
                    label='Resolver'
                    value={migration.resolverValue}
                    placeholder='Leave empty to deploy a resolver'
                    autoComplete='off'
                    spellCheck={false}
                    list={resolverListId}
                    onChange={(event) => {
                      migration.setResolverInput(event.target.value.trim())
                      migration.setConfiguration('0')
                    }}
                  />
                  <datalist id={resolverListId}>
                    {migration.directory.resolvers.map((resolver) => (
                      <option
                        key={resolver.address}
                        value={resolver.address}
                        label={resolver.name ?? resolver.address}
                      />
                    ))}
                  </datalist>
                  <p className='text-neutral text-sm'>
                    {migration.mode === 'existing'
                      ? 'Names share this configuration. Future edits also affect other names linked to it.'
                      : 'Each name gets a separate configuration. Leave the resolver empty to deploy one first.'}{' '}
                    Locked resolvers are preserved; replaced Public Resolvers have their records restored after
                    migration.
                  </p>
                  {catalog.isLoading && <SkeletonText label='Checking resolver permissions…' className='w-48' />}
                  {catalog.isError && (
                    <>
                      <Notice tone='danger'>{roleErrorText(catalog.error)}</Notice>
                      <SecondaryButton onClick={() => void catalog.refetch()}>Retry resolver</SecondaryButton>
                    </>
                  )}
                  {migration.mode === 'existing' && catalog.data && (
                    <>
                      <Dropdown
                        label='Configuration'
                        dropdownPosition='top'
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
                </>
              )}
              {copies && (
                <>
                  {source.isLoading && <SkeletonText label='Reading existing records…' className='w-48' />}
                  {source.isError && (
                    <>
                      <Notice tone='danger' title='Records could not be read'>
                        Migration is blocked until all records to copy are loaded. {roleErrorText(source.error)}
                      </Notice>
                      <SecondaryButton onClick={() => void source.refetch()}>Retry records</SecondaryButton>
                    </>
                  )}
                  <p className='text-neutral text-sm'>
                    Review each name’s records below. Custom offchain behavior and records without discoverable keys
                    cannot be copied automatically.
                  </p>
                </>
              )}
              <details className='border-tertiary rounded-md border'>
                <summary className='cursor-pointer p-3 font-semibold'>Review {eligible.length} eligible names</summary>
                <div className='border-tertiary max-h-64 overflow-y-auto border-t'>
                  {eligible.map((name) => {
                    const records = source.data?.[name.name]
                    const copying = name.replacesResolver || (name.fixedResolver === null && migration.mode === 'copy')
                    return (
                      <details key={name.name} className='border-tertiary border-b p-3 last:border-b-0'>
                        <summary className='cursor-pointer break-all'>
                          {name.name}
                          <span className='text-neutral ml-2 text-sm'>
                            {copying
                              ? `${records?.length ?? '…'} records to copy`
                              : name.fixedResolver !== null
                                ? 'Resolver locked'
                                : 'Ready'}
                          </span>
                        </summary>
                        <p className='text-neutral mt-2 text-sm'>
                          {name.replacesResolver
                            ? 'Records will be restored in PublicResolverV2 after migration.'
                            : name.fixedResolver !== null
                              ? 'The current resolver and its records are preserved.'
                              : name.locked
                                ? 'Burned fuse restrictions become V2 permissions. A subregistry is created automatically.'
                                : 'Your wallet remains the owner.'}
                        </p>
                        {copying &&
                          records?.map((record) => (
                            <div key={`${record.kind}:${record.key}`} className='mt-2 text-sm'>
                              <p className='font-semibold'>{recordLabel(record)}</p>
                              <p className='text-neutral break-all'>{record.value}</p>
                            </div>
                          ))}
                        {copying && records?.length === 0 && (
                          <p className='text-neutral mt-2 text-sm'>No records found to copy.</p>
                        )}
                      </details>
                    )
                  })}
                </div>
              </details>
              {flexible && (migration.mode === 'empty' || migration.mode === 'none') && (
                <Notice tone='warning'>
                  Names without a locked resolver will not have their existing records copied.
                  {migration.mode === 'empty'
                    ? ' Each gets an empty configuration; addresses and profile records stop resolving until added again.'
                    : ' No resolver will be assigned directly. Subnames may inherit their parent’s resolver; other records stop resolving.'}
                </Notice>
              )}
            </>
          )}
          {excluded.length > 0 && (
            <details className='border-tertiary rounded-md border' open={!eligible.length}>
              <summary className='cursor-pointer p-3 font-semibold'>{excluded.length} names excluded</summary>
              <div className='border-tertiary max-h-52 overflow-y-auto border-t'>
                {excluded.map(({ name, message }) => (
                  <div key={name} className='border-tertiary border-b p-3 last:border-b-0'>
                    <p className='font-semibold break-all'>{name}</p>
                    <p className='text-neutral text-sm'>{message}</p>
                  </div>
                ))}
              </div>
              <SecondaryButton
                className='m-3'
                disabled={loading.isFetching}
                onClick={() => {
                  migration.setAcknowledged(false)
                  void loading.refetch()
                }}
              >
                {loading.isFetching ? 'Checking…' : 'Check names again'}
              </SecondaryButton>
            </details>
          )}
          {!eligible.length && <p className='text-neutral text-lg'>None of the selected names can migrate.</p>}
          {eligible.length > 0 && (
            <label className='text-md flex cursor-pointer items-center gap-2'>
              <input
                type='checkbox'
                className='accent-primary h-4 w-4 shrink-0 cursor-pointer'
                checked={migration.acknowledged}
                onChange={(event) => migration.setAcknowledged(event.target.checked)}
              />
              <span>I reviewed the names and records and understand that migration is permanent.</span>
            </label>
          )}
        </>
      )}
    </>
  )

  let footer: React.ReactNode = (
    <>
      <PrimaryButton
        className={modalPrimaryActionClassName}
        disabled={!migration.canMigrate}
        onClick={() => void migration.migrate()}
      >
        Migrate {eligible.length} {eligible.length === 1 ? 'name' : 'names'} to ENS V2
      </PrimaryButton>
      <SecondaryButton className={modalActionClassName} onClick={close}>
        Cancel
      </SecondaryButton>
    </>
  )

  if (view && transaction.busy) {
    content = (
      <TransactionProgress
        view={view}
        title={
          migration.migrated ? `${migration.migratedCount} of ${eligible.length} Names Migrated` : 'Bulk Migration'
        }
      />
    )
    footer = null
  } else if (migration.complete) {
    content = (
      <>
        <TxStatus
          state='success'
          title='Migration Complete'
          message={`${eligible.length} ${eligible.length === 1 ? 'name is' : 'names are'} now managed through ENS V2. Your wallet remains the owner.`}
        />
        {view && <TransactionLinks links={confirmedTransactions(view)} />}
      </>
    )
    footer = (
      <PrimaryButton className={modalPrimaryActionClassName} onClick={onClose}>
        Close
      </PrimaryButton>
    )
  } else if (view && transaction.submitted) {
    content = <TransactionUnconfirmed view={view} />
    footer = (
      <PrimaryButton className={modalPrimaryActionClassName} onClick={() => void transaction.run()}>
        Check Transaction
      </PrimaryButton>
    )
  } else if (view?.phase === 'error' || migration.migrated) {
    content = view ? (
      <TransactionFailure
        view={view}
        title={
          allMigrated
            ? 'Records Not Restored'
            : migration.migrated
              ? 'Migration Partially Completed'
              : 'Migration Not Completed'
        }
        message={
          allMigrated
            ? 'Your names have migrated. Keep this window open to finish restoring their records. Retrying resumes the remaining work.'
            : migration.migrated
              ? `${migration.migratedCount} of ${eligible.length} names have migrated. Keep this window open to migrate the remaining names and finish any record restoration. Retrying skips confirmed migrations.`
              : 'Your names have not migrated. Confirmed steps are saved for retry.'
        }
      />
    ) : (
      <Notice tone='warning'>
        {migration.migratedCount} of {eligible.length} names have migrated. Finish the remaining steps before closing.
      </Notice>
    )
    footer = (
      <>
        <PrimaryButton className={modalPrimaryActionClassName} onClick={() => void transaction.run()}>
          {allMigrated ? 'Finish Copying Records' : 'Retry Remaining Steps'}
        </PrimaryButton>
        <SecondaryButton className={modalActionClassName} onClick={migration.migrated ? close : transaction.reset}>
          {migration.migrated ? 'Close' : 'Back to Review'}
        </SecondaryButton>
      </>
    )
  }

  return (
    <>
      <div
        ref={dialog}
        tabIndex={-1}
        className='outline-none'
        onKeyDown={(event) => {
          if (discard || event.key !== 'Tab') return
          const elements = Array.from(
            dialog.current?.querySelectorAll<HTMLElement>(
              'button:not(:disabled), input:not(:disabled), summary, a[href]'
            ) ?? []
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
          title='Bulk Migration'
          onClose={close}
          locked={locked}
          dismissible={!locked && !discard}
          stageKey={transaction.phase}
          footer={footer}
          footerHint={view && transaction.busy && !isWalletPrompt(view) ? KEEP_OPEN_HINT : undefined}
        >
          {content}
        </ModalShell>
      </div>
      {discard && (
        <DiscardChangesModal
          onCancel={() => setDiscard(false)}
          onDiscard={onClose}
          pendingTransaction={migration.migrated}
          description={
            migration.migrated
              ? `${migration.migratedCount} of ${eligible.length} names have already migrated. Closing discards the remaining migration and record-copy work in this window. Unfinished work must be completed separately; confirmed migrations cannot be undone.`
              : undefined
          }
        />
      )}
    </>
  )
}

const BulkMigrationModal = (props: BulkMigrationModalProps) => (
  <SettingsTransactionProvider inline>
    <BulkMigrationForm {...props} />
  </SettingsTransactionProvider>
)

export default BulkMigrationModal
