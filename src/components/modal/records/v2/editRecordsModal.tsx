'use client'

import { RecordsSkeleton, ReviewSkeleton, RecordListSkeleton } from '@/components/ui/ensSkeletons'

import { useEffect, useRef, useState } from 'react'
import { useV2EditRecords } from '@/hooks/records/useV2EditRecords'
import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'
import TabSelector from '@/components/ui/tabSelector'
import Dropdown from '@/components/ui/dropdown'
import { cn } from '@/utils/tailwind'
import { beautifyName } from '@/lib/ens'
import RecordForm from './recordForm'
import Input from '@/components/ui/input'
import { Cross, ShortArrow } from 'ethereum-identity-kit'
import { useV2RoleEditor, useV2RoleTransaction } from '@/hooks/records/useV2Roles'
import RolesEditor from './rolesEditor'
import DiscardChangesModal from '../components/discardChangesModal'
import { buildRoleTransactions } from '@/utils/records/v2RoleDrafts'
import { TxScreenPanel, plural, shortAddress } from '../components/txScreen'
import { getRolesScreen, getV2EditorScreen } from '../components/recordsTxScreens'
import { useConfigurationPreferences } from '@/hooks/settings/useResolverPreferences'
import { configurationName, resolverDefaultName } from '@/utils/settings/labels'
import { ResolverAddress } from '@/components/settings/shared'

const V2EditRecordsModal = ({
  name,
  defaultTab,
  onClose,
}: {
  name: string
  defaultTab: 'records' | 'roles'
  onClose: () => void
}) => {
  const [tab, setTab] = useState<string>(defaultTab)
  const editor = useV2EditRecords(name, tab !== 'roles')
  const preferences = useConfigurationPreferences(editor.binding?.resolver, editor.resolverExists && tab === 'records')
  const roles = useV2RoleEditor(name, tab === 'roles')
  const roleTransaction = useV2RoleTransaction(name, roles.onConfirmed)
  const [rolesOpened, setRolesOpened] = useState(defaultTab === 'roles')
  const [discardAction, setDiscardAction] = useState<'close' | 'resolver' | null>(null)
  const [resolverFocused, setResolverFocused] = useState(false)
  const [configExpanded, setConfigExpanded] = useState(false)
  // What the running save changes, captured on click: the drafts are cleared once it succeeds.
  const [recordsRun, setRecordsRun] = useState<{ meta?: string; message?: string }>({})
  const [roleChangeCount, setRoleChangeCount] = useState(0)
  const contentRef = useRef<HTMLDivElement>(null)
  const busy = editor.isBusy || roleTransaction.busy
  const hasRecordChanges = editor.step !== 'success' && editor.hasChanges
  const hasChanges =
    hasRecordChanges || editor.hasResolverChanges || roles.hasChanges || !!editor.pending || !!roleTransaction.pending

  const close = () => {
    if (busy) return
    if (hasChanges) setDiscardAction('close')
    else onClose()
  }

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 })
  }, [tab])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented && !discardAction) {
        event.preventDefault()
        close()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  })

  let roleTransactionCount = 0
  try {
    if (roles.data.address) roleTransactionCount = buildRoleTransactions(roles.changes, roles.data.address).length
  } catch {
    /* Validation is reported before saving. */
  }

  const changeResolver = () => {
    if (hasRecordChanges || roles.hasChanges) setDiscardAction('resolver')
    else void editor.useResolver()
  }

  const catalog = editor.catalog
  // IDs are sequential onchain; discovering the list does not require indexed events.
  const count = catalog?.recordCount ?? BigInt(0)
  const ids = Array.from({ length: Number(count > BigInt(1000) ? BigInt(1000) : count) }, (_, index) => `${index + 1}`)
  if (editor.selectedId > BigInt(1000)) ids.push(editor.selected)
  const options = editor.resolvers.filter(
    (resolver) =>
      !editor.resolverInput ||
      resolver.address.toLowerCase().includes(editor.resolverInput.toLowerCase()) ||
      resolver.name?.toLowerCase().includes(editor.resolverInput.toLowerCase())
  )
  const resolverLabel = editor.resolvers.find(
    (resolver) => resolver.address.toLowerCase() === editor.resolverInput.toLowerCase()
  )?.name
  const configurationLabel =
    editor.selectedId === BigInt(0)
      ? resolverDefaultName(preferences.data, catalog?.defaultRecordId)
      : configurationName(preferences.data, editor.selectedId)

  const saveRecords = () => {
    const display = beautifyName(name)
    const changed = editor.records.filter((row) => row.value !== row.initialValue).length
    const isDefault = editor.selectedId === BigInt(0)
    const relinks = !!catalog && editor.mode === 'shared' && editor.selectedId !== catalog.linkedRecordId
    setRecordsRun({
      meta: [
        changed > 0 && plural(changed, 'record change'),
        editor.mode !== 'shared' ? 'New configuration' : isDefault ? 'Resolver default' : configurationLabel,
      ]
        .filter(Boolean)
        .join(' · '),
      message:
        editor.mode !== 'shared'
          ? `${display} is linked to its new configuration.`
          : relinks
            ? `${display} now uses ${isDefault ? 'the resolver default' : configurationLabel}.`
            : isDefault
              ? 'Every unlinked name on this resolver now uses these records.'
              : `Every name linked to ${configurationLabel} now uses these records.`,
    })
    void editor.save()
  }

  const saveRoles = () => {
    setRoleChangeCount(roles.changes.length)
    void roleTransaction.submit(roles.changes)
  }

  const recordsScreen = getV2EditorScreen({
    name,
    step: editor.step,
    phase: editor.phase,
    operation: editor.operation,
    txHash: editor.txHash,
    pending: !!editor.pending,
    error: editor.error,
    errorDetails: editor.errorDetails,
    meta:
      editor.operation === 'records'
        ? recordsRun.meta
        : editor.operation === 'resolver'
          ? `${resolverLabel ? `${resolverLabel} · ` : ''}Resolver ${shortAddress(editor.resolverInput)}`
          : 'New resolver',
    successMessage: recordsRun.message,
    draftsRemain: roles.hasChanges || editor.hasResolverChanges,
    onBack: editor.retry,
    onCheck: editor.retry,
    onReload: async () => {
      await editor.refresh()
      editor.retry()
    },
    onClose: close,
  })

  const rolesScreen = getRolesScreen({
    name,
    step: roleTransaction.step,
    phase: roleTransaction.phase,
    runTotal: roleTransaction.runTotal,
    hashes: roleTransaction.runHashes,
    submittedHash: roleTransaction.pending?.hash ?? null,
    pending: !!roleTransaction.pending,
    changeCount: roleChangeCount,
    error: roleTransaction.error,
    errorDetails: roleTransaction.errorDetails,
    onBack: roleTransaction.reset,
    onCheck: saveRoles,
    onClose: close,
  })
  // The busy flow first; otherwise a records result, then a permissions result.
  const screen = roleTransaction.busy ? rolesScreen : (recordsScreen ?? rolesScreen)

  return (
    <>
      <div
        role='dialog'
        aria-modal='true'
        aria-labelledby='v2-records-title'
        className='fixed inset-0 z-100 flex h-dvh items-end justify-center bg-black/40 backdrop-blur-sm md:items-center md:p-4'
        onClick={(event) => {
          event.stopPropagation()
          close()
        }}
      >
        <div
          className='bg-background border-tertiary flex h-[calc(100dvh-56px)] w-full flex-col overflow-hidden rounded-md border-t shadow-lg md:max-h-200 md:max-w-xl md:border-2'
          onClick={(event) => event.stopPropagation()}
        >
          <div className='border-tertiary flex shrink-0 items-center justify-between gap-3 border-b px-4 py-2 sm:pl-6'>
            <div className='min-w-0'>
              <h2 id='v2-records-title' className='text-xl font-bold'>
                Edit {name}
              </h2>
            </div>
            <button
              type='button'
              aria-label='Close record editor'
              disabled={busy}
              onClick={close}
              className={cn(
                'hover:bg-secondary p-md cursor-pointer rounded-md text-xl disabled:opacity-50',
                busy && 'pointer-events-none disabled:opacity-0'
              )}
            >
              <Cross className='h-3.5 w-3.5' />
            </button>
          </div>
          {screen ? (
            // In-progress, success and error screens inside the editor's own frame, which stays locked while busy.
            <TxScreenPanel screen={screen} center onClose={onClose} />
          ) : (
            <>
              <div className='shrink-0 px-4 pt-4 sm:px-6'>
                <TabSelector
                  tabs={[
                    { label: 'Records', value: 'records' },
                    { label: 'Roles', value: 'roles' },
                    { label: 'Resolver', value: 'resolver' },
                  ]}
                  selectedTab={tab}
                  setSelectedTab={(next) => {
                    if (!roleTransaction.busy && !roleTransaction.pending) {
                      if (next === 'roles') setRolesOpened(true)
                      setTab(next)
                    }
                  }}
                  tabClassName='flex-1'
                />
              </div>
              <div
                ref={contentRef}
                className='flex min-h-0 flex-1 scrollbar-gutter-stable flex-col gap-4 overflow-y-auto overscroll-contain p-4 sm:px-6'
              >
                {rolesOpened && (
                  <div className={tab === 'roles' ? '' : 'hidden'}>
                    <RolesEditor editor={roles} transaction={roleTransaction} />
                  </div>
                )}
                {editor.binding && (tab === 'resolver' || (tab === 'records' && !editor.resolverExists)) && (
                  <div className='flex flex-col gap-3'>
                    <Input
                      label='Address'
                      aria-label='Resolver address'
                      autoComplete='off'
                      spellCheck={false}
                      value={editor.resolverInput}
                      onChange={(event) => editor.setResolverInput(event.target.value)}
                      onFocus={() => setResolverFocused(true)}
                      onBlur={() => setResolverFocused(false)}
                      disabled={!editor.binding?.canSetResolver}
                      placeholder='0x…'
                    />
                    {resolverFocused && options.length > 0 && (
                      <div className='border-tertiary max-h-36 overflow-y-auto rounded-md border'>
                        {options.map((resolver, index) => (
                          <button
                            type='button'
                            key={resolver.address}
                            className={cn(
                              'hover:bg-secondary flex w-full cursor-pointer flex-col px-3 py-2 text-left text-sm',
                              index > 0 && 'border-tertiary border-t'
                            )}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => {
                              editor.setResolverInput(resolver.address)
                              setResolverFocused(false)
                            }}
                          >
                            <ResolverAddress
                              address={resolver.address}
                              name={resolver.name}
                              showLabel
                              canCopy={false}
                              etherscan={false}
                              truncate={false}
                            />
                          </button>
                        ))}
                      </div>
                    )}
                    {editor.binding?.canSetResolver ? (
                      <div className='bg-secondary border-tertiary p-lg flex items-center justify-between gap-4 rounded-md border'>
                        <p className='text-neutral text-lg'>
                          Deploy a new resolver to manage a separate set of records and permissions. Deployment requires
                          a gas fee. Confirm below to assign it to this name.
                        </p>
                        <SecondaryButton className='shrink-0' onClick={editor.deployNewResolver}>
                          Deploy
                        </SecondaryButton>
                      </div>
                    ) : (
                      <p className='text-neutral text-sm'>
                        Your wallet does not have permission to change this name’s resolver.
                      </p>
                    )}
                  </div>
                )}
                {tab !== 'roles' &&
                  editor.isLoading &&
                  (tab === 'records' ? (
                    <RecordsSkeleton configuration label='Loading configurations and permissions…' />
                  ) : (
                    <ReviewSkeleton label='Loading resolver and permissions…' />
                  ))}
                {tab !== 'roles' && editor.loadError && (
                  <div className='flex flex-col gap-2'>
                    <p className='wrap-break-word text-red-400' role='alert'>
                      {editor.binding
                        ? 'Could not load records from this resolver.'
                        : 'Could not look up this name’s resolver.'}{' '}
                      {editor.loadError}
                    </p>
                    <div className='flex items-center gap-2'>
                      <SecondaryButton onClick={editor.refresh}>Retry loading</SecondaryButton>
                      {editor.binding && tab === 'records' && (
                        <SecondaryButton
                          onClick={() => {
                            setTab('resolver')
                          }}
                        >
                          View resolver
                        </SecondaryButton>
                      )}
                    </div>
                  </div>
                )}
                {tab === 'records' && catalog && !editor.isLoading && !editor.loadError && (
                  <>
                    <div className='border-tertiary rounded-md border p-3'>
                      <button
                        type='button'
                        aria-expanded={configExpanded}
                        className='flex w-full items-center justify-between gap-2 text-left'
                        onClick={() => setConfigExpanded(!configExpanded)}
                      >
                        <span className='text-md font-semibold'>
                          {editor.mode === 'shared'
                            ? configurationLabel
                            : editor.mode === 'copy'
                              ? `New configuration · copy (${configurationName(preferences.data, editor.selected)})`
                              : 'New configuration · empty'}
                        </span>
                        <ShortArrow className={cn('h-3 w-3 transition-transform', !configExpanded && 'rotate-180')} />
                      </button>
                      {configExpanded && (
                        <div className='mt-3 flex flex-col gap-3'>
                          {editor.mode !== 'shared' && (
                            <div className='bg-secondary border-tertiary rounded-md border p-2'>
                              <p className='text-neutral text-md font-medium'>
                                Saving creates a separate configuration and links this name to it.
                              </p>
                            </div>
                          )}
                          <div className='flex flex-col gap-2'>
                            <Dropdown
                              label='Configuration'
                              hideLabel
                              value={editor.selected}
                              disabled={!catalog.canLink}
                              onSelect={(value) => editor.changeView('shared', String(value))}
                              options={[
                                {
                                  value: '0',
                                  label: `Use ${resolverDefaultName(preferences.data, catalog.defaultRecordId)}`,
                                },
                                ...ids.map((id) => ({
                                  value: id,
                                  label: `${configurationName(preferences.data, id)}${id === catalog.defaultRecordId.toString() ? ' (resolver default)' : ''}`,
                                })),
                              ]}
                            />
                          </div>
                          {count > BigInt(1000) && (
                            <label className='flex flex-col gap-1 text-sm'>
                              Or enter a configuration ID (1–{count.toString()})
                              <input
                                aria-label='Configuration ID'
                                inputMode='numeric'
                                className='bg-secondary border-tertiary rounded-md border px-3 py-2'
                                value={editor.selected}
                                disabled={!catalog.canLink}
                                onChange={(event) => editor.changeView('shared', event.target.value)}
                              />
                            </label>
                          )}
                          {!catalog.canLink && (
                            <p className='text-neutral text-xs'>
                              Link permission is required to switch configurations.
                            </p>
                          )}
                          <div className='bg-secondary flex flex-wrap justify-between'>
                            {(['shared', 'copy', 'new'] as const).map((mode) => (
                              <button
                                type='button'
                                key={mode}
                                onClick={() => editor.changeView(mode)}
                                disabled={
                                  (mode === 'copy' && !editor.hasCompleteRecords) ||
                                  (mode !== 'shared' && !catalog.canLink && catalog.linkedRecordId !== BigInt(0))
                                }
                                className={cn(
                                  'w-1/3 rounded-md px-2.5 py-1.5 text-lg font-semibold disabled:opacity-40',
                                  editor.mode === mode ? 'bg-primary text-background' : 'bg-secondary hover:bg-tertiary'
                                )}
                              >
                                {mode === 'shared'
                                  ? 'Edit existing'
                                  : mode === 'copy'
                                    ? 'Create a copy'
                                    : 'Start empty'}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {editor.mode !== 'shared' && !editor.records.some((row) => row.value) && (
                        <p className='text-grace mt-2 text-sm'>
                          You are creating an empty configuration. This name will have no records, including no
                          receiving address.
                        </p>
                      )}
                      {editor.mode === 'copy' && (
                        <p className='text-neutral mt-2 text-xs'>
                          Copying requires write permission for every populated record.
                        </p>
                      )}
                    </div>
                    {!editor.hasCompleteRecords && !editor.discoveryError && (
                      <RecordListSkeleton label='Loading additional records…' rows={1} />
                    )}
                    {!editor.hasCompleteRecords && editor.discoveryError && (
                      <div className='text-neutral flex flex-col gap-2 text-sm' role='status'>
                        <p>
                          Additional records could not be loaded. You can edit the records below or add a key to load
                          its current value. Copying is unavailable until all records are loaded.
                        </p>
                        <SecondaryButton onClick={editor.retryDiscovery} disabled={editor.isDiscovering}>
                          {editor.isDiscovering ? 'Loading additional records…' : 'Retry additional records'}
                        </SecondaryButton>
                      </div>
                    )}
                    <RecordForm
                      name={name}
                      records={editor.records}
                      updateRecord={editor.updateRecord}
                      addRecord={editor.addRecord}
                      isAdding={editor.isAdding}
                    />
                    {editor.validationError && (
                      <p className='text-sm text-red-400' role='alert'>
                        {editor.validationError}
                      </p>
                    )}
                    {editor.error && (
                      <p className='text-sm text-red-400' role='alert'>
                        {editor.error}
                      </p>
                    )}
                  </>
                )}
              </div>
              <div className='border-tertiary flex shrink-0 flex-col gap-2 border-t p-4 sm:px-6'>
                {tab === 'records' && editor.resolverExists && (
                  <>
                    {editor.mode === 'shared' &&
                      !editor.isLoading &&
                      !editor.loadError &&
                      (editor.configurationNameCount ?? 0) > 1 && (
                        <p
                          className='bg-secondary border-tertiary text-grace text-md rounded-md border p-3'
                          role='status'
                        >
                          Updating these records affects all names using this configuration.
                        </p>
                      )}
                    <PrimaryButton className='w-full' onClick={saveRecords} disabled={!editor.canSave}>
                      {editor.mode === 'shared' ? 'Save changes' : 'Create configuration'}
                    </PrimaryButton>
                  </>
                )}
                {tab === 'roles' && (
                  <>
                    {roleTransactionCount > 1 && (
                      <p className='text-neutral text-center text-lg'>
                        {roleTransactionCount} transactions will save your permission changes.
                      </p>
                    )}
                    <PrimaryButton
                      className='w-full'
                      onClick={saveRoles}
                      disabled={busy || roles.walletChanged || (!roles.hasChanges && !roleTransaction.pending)}
                    >
                      {roleTransaction.pending ? 'Check transaction' : 'Save changes'}
                    </PrimaryButton>
                  </>
                )}
                {tab === 'resolver' && (
                  <PrimaryButton
                    className='w-full'
                    onClick={changeResolver}
                    disabled={
                      !editor.resolverInput ||
                      editor.resolverInput.toLowerCase() === editor.binding?.directResolver.toLowerCase()
                    }
                  >
                    Confirm
                  </PrimaryButton>
                )}
                <SecondaryButton className='w-full' onClick={close}>
                  Close
                </SecondaryButton>
              </div>
            </>
          )}
        </div>
      </div>
      {discardAction && (
        <DiscardChangesModal
          changingResolver={discardAction === 'resolver'}
          pendingTransaction={!!editor.pending || !!roleTransaction.pending}
          onCancel={() => setDiscardAction(null)}
          onDiscard={() => {
            const action = discardAction
            setDiscardAction(null)
            if (action === 'close') onClose()
            else {
              roles.reset()
              editor.discardChanges()
              void editor.useResolver()
            }
          }}
        />
      )}
    </>
  )
}

export default V2EditRecordsModal
