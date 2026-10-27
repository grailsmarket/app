'use client'

import { useEffect, useState } from 'react'
import { Cross, ShortArrow } from 'ethereum-identity-kit'
import { useBulkV2EditRecords } from '@/hooks/records/useBulkV2EditRecords'
import { useConfigurationPreferences, useResolverPreferences } from '@/hooks/settings/useResolverPreferences'
import type { BulkV2Configuration, BulkV2Resolver } from '@/types/records'
import { bulkGroupNameCount } from '@/utils/records/bulkV2Records'
import { configurationName, resolverDefaultName, resolverLabel } from '@/utils/settings/labels'
import { beautifyName } from '@/lib/ens'
import { cn } from '@/utils/tailwind'
import { ResolverAddress } from '@/components/settings/shared'
import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'
import Dropdown from '@/components/ui/dropdown'
import TabSelector from '@/components/ui/tabSelector'
import NameImage from '@/components/ui/nameImage'
import { RecordsSkeleton } from '@/components/ui/ensSkeletons'
import DiscardChangesModal from '../components/discardChangesModal'
import RecordForm from './recordForm'

type BulkEditor = ReturnType<typeof useBulkV2EditRecords>

interface SelectedNameProps {
  name: string
}

const SelectedName = ({ name }: SelectedNameProps) => (
  <span className='flex min-w-0 items-center gap-2'>
    <NameImage name={name} tokenId='' version={2} expiryDate={null} className='h-7 w-7 shrink-0 rounded-sm' />
    <span className='truncate'>{beautifyName(name)}</span>
  </span>
)

interface ResolverConfigurationsProps {
  resolver: BulkV2Resolver
  editor: BulkEditor
  tab: string
  label?: string | null
  onSelect: (name: string, value: string) => void
}

const ResolverConfigurations = ({ resolver, editor, tab, label, onSelect }: ResolverConfigurationsProps) => {
  const preferences = useConfigurationPreferences(resolver.address)
  const groups = editor.groups.filter((group) => group.resolver === resolver.address)
  const [expanded, setExpanded] = useState(groups[0]?.key ?? '')
  const { catalog } = resolver
  const ids = catalog.configurations
    ? catalog.configurations.map((record) => record.record_id)
    : Array.from({ length: Number(catalog.recordCount > BigInt(1000) ? BigInt(1000) : catalog.recordCount) }, (_, i) =>
        String(i + 1)
      )
  const title = (group: BulkV2Configuration) =>
    group.mode === 'shared'
      ? group.id === BigInt(0)
        ? 'No configuration'
        : `${configurationName(preferences.data, group.id)}${group.id === catalog.defaultRecordId ? ' · Default' : ''}`
      : group.mode === 'copy'
        ? `New copy of ${configurationName(preferences.data, group.id)}`
        : 'New configuration'

  return (
    <section className='flex min-w-0 flex-col gap-2'>
      <ResolverAddress
        address={resolver.address}
        name={label}
        showLabel
        canCopy={false}
        etherscan={false}
        truncate={false}
      />
      {tab === 'names' ? (
        <div className='border-tertiary rounded-md border'>
          {resolver.names.map((name) => {
            const value = editor.selections[name.name] ?? name.linkedId.toString()
            const availableIds = [
              ...new Set([
                ...ids,
                ...(name.linkedId ? [name.linkedId.toString()] : []),
                ...(/^\d+$/.test(value) && BigInt(value) > BigInt(0) ? [value] : []),
              ]),
            ]

            const options = [
              { value: '0', label: `Use ${resolverDefaultName(preferences.data, catalog.defaultRecordId)}` },
              ...availableIds.map((id) => ({ value: id, label: configurationName(preferences.data, id) })),
              { value: 'new', label: 'Create a new configuration' },
              ...(name.linkedId || catalog.defaultRecordId ? [{ value: 'copy', label: 'Create a separate copy' }] : []),
            ].filter(
              (option) =>
                catalog.canLink ||
                option.value === name.linkedId.toString() ||
                (!name.linkedId && option.value === 'new') ||
                (!name.linkedId && option.value === 'copy')
            )

            const changed = value !== name.linkedId.toString()

            return (
              <div key={name.name} className='border-tertiary flex flex-col gap-3 border-b p-3 last:border-b-0'>
                <div className='flex items-center justify-between gap-2'>
                  <SelectedName name={name.name} />
                  {changed && <span className='text-primary text-sm'>Changed</span>}
                </div>
                <Dropdown
                  label={`Configuration for ${beautifyName(name.name)}`}
                  hideLabel
                  value={value}
                  options={options}
                  disabled={editor.locked || options.length < 2}
                  onSelect={(value) => onSelect(name.name, String(value))}
                />
                {!catalog.configurations && catalog.recordCount > BigInt(1000) && catalog.canLink && (
                  <label className='text-neutral flex flex-col gap-1 text-sm'>
                    Or enter a configuration ID (1–{catalog.recordCount.toString()})
                    <input
                      type='text'
                      inputMode='numeric'
                      className='bg-secondary border-tertiary rounded-md border px-3 py-2'
                      disabled={editor.locked}
                      onChange={(event) => {
                        const id = event.target.value
                        if (/^\d+$/.test(id) && BigInt(id) > BigInt(0) && BigInt(id) <= catalog.recordCount)
                          onSelect(name.name, id)
                      }}
                    />
                  </label>
                )}
                {!catalog.canLink && (
                  <p className='text-neutral text-sm'>Link permission is required to switch existing configurations.</p>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className='flex flex-col gap-3'>
          {groups.map((group) => {
            const index = editor.groups.findIndex((item) => item.key === group.key)
            const query = editor.recordQueries[index]
            const records = editor.records[group.key]
            const open =
              expanded === group.key ||
              (expanded !== '' && !groups.some((item) => item.key === expanded) && group.key === groups[0]?.key)
            const count = bulkGroupNameCount(resolver, group)
            const changed = editor.changedGroups.some((item) => item.key === group.key)

            return (
              <div key={group.key} className='border-tertiary rounded-md border'>
                <button
                  type='button'
                  aria-expanded={open}
                  className='flex w-full cursor-pointer items-center justify-between gap-3 p-3 pt-2.5 text-left'
                  onClick={() => setExpanded(open ? '' : group.key)}
                >
                  <div className='flex w-full flex-wrap items-center justify-between gap-2 gap-y-0.5'>
                    <span className='text-lg font-semibold'>{title(group)}</span>
                    <span className='text-neutral text-md'>
                      {group.names.length} selected · {count === undefined ? 'Total usage unknown' : `${count} names`}
                      {changed && <span className='text-primary'> · Changed</span>}
                    </span>
                  </div>
                  <ShortArrow className={cn('h-4 w-4 shrink-0 transition-transform', !open && 'rotate-180')} />
                </button>
                <div className='text-md flex flex-wrap gap-3 px-3 pb-3 font-medium'>
                  {group.names.map(({ name }) => (
                    <SelectedName key={name} name={name} />
                  ))}
                </div>
                {open && (
                  <div className='border-tertiary flex flex-col gap-3 border-t p-3'>
                    {group.mode === 'shared' && group.id > BigInt(0) && (count === undefined || count > 1) && (
                      <p
                        className='bg-secondary border-tertiary text-grace text-md rounded-md border p-3'
                        role='status'
                      >
                        {count === undefined
                          ? 'These records may also be used by names outside this selection. Editing affects every name using this configuration.'
                          : `Editing these records affects all ${count} names using this configuration${count > group.names.length ? ', including names outside this selection' : ''}.`}{' '}
                        Use the Names tab to give an individual name a separate configuration.
                      </p>
                    )}
                    {group.mode !== 'shared' && (
                      <p className='text-neutral text-md'>
                        {group.mode === 'copy'
                          ? 'Start from the current records and save a separate copy for this name. Copying requires write access to every populated record.'
                          : 'Editing these records creates a separate configuration for this name. Its current configuration is unchanged.'}
                      </p>
                    )}
                    {group.mode === 'new' && changed && !records?.some((row) => row.value) && (
                      <p className='text-grace text-md'>
                        This will create an empty configuration, with no receiving address.
                      </p>
                    )}
                    {group.mode === 'shared' && group.id === BigInt(0) ? (
                      <p className='text-neutral text-md'>
                        This resolver has no default configuration. Choose or create a configuration for each name in
                        the Names tab.
                      </p>
                    ) : !records ? (
                      query.isError ? (
                        <div className='flex flex-col gap-2'>
                          <p className='text-sm text-red-400' role='alert'>
                            {query.error.message}
                          </p>
                          <SecondaryButton onClick={() => query.refetch()}>Retry records</SecondaryButton>
                        </div>
                      ) : (
                        <RecordsSkeleton label='Loading configuration records…' />
                      )
                    ) : (
                      <fieldset disabled={editor.locked} className='flex min-w-0 flex-col gap-3'>
                        <RecordForm
                          name={group.names[0].name}
                          records={records}
                          updateRecord={(key, value) => editor.updateRecord(group, key, value)}
                          addRecord={(field) => editor.addRecord(group, field)}
                          isAdding={editor.adding === group.key}
                        />
                      </fieldset>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

interface V2BulkEditRecordsModalProps {
  names: string[]
  onClose: (txConfirmed?: boolean) => void
}

const V2BulkEditRecordsModal = ({ names, onClose }: V2BulkEditRecordsModalProps) => {
  const [tab, setTab] = useState('configurations')
  const [discard, setDiscard] = useState<'close' | { name: string; value: string }>()
  const editor = useBulkV2EditRecords(names, onClose)
  const preferences = useResolverPreferences()

  const close = () => {
    if (editor.transaction.phase !== 'idle') return
    if (editor.hasChanges) setDiscard('close')
    else onClose()
  }

  const select = (name: string, value: string) => {
    const group = editor.groups.find((group) => group.names.some((item) => item.name === name))
    const initial = group?.names.find((item) => item.name === name)?.linkedId.toString()

    if (value === (editor.selections[name] ?? initial)) return
    if (editor.selectionDiscardsRecords(name, value)) setDiscard({ name, value })
    else editor.selectConfiguration(name, value)
  }

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !discard && editor.transaction.phase === 'idle') {
        if (editor.hasChanges) setDiscard('close')
        else onClose()
      }
    }

    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (editor.hasChanges || editor.transaction.pending) event.preventDefault()
    }

    window.addEventListener('keydown', keydown)
    window.addEventListener('beforeunload', beforeUnload)

    return () => {
      window.removeEventListener('keydown', keydown)
      window.removeEventListener('beforeunload', beforeUnload)
    }
  }, [discard, editor.hasChanges, editor.transaction.phase, editor.transaction.pending, onClose])

  return (
    <>
      <div
        role='dialog'
        aria-modal='true'
        aria-label='Edit V2 records'
        className='fixed inset-0 top-0 left-0 z-100 flex h-screen items-end justify-center bg-black/40 backdrop-blur-sm md:items-start md:p-4'
        onClick={close}
      >
        <div
          className='bg-background border-tertiary flex h-[calc(100dvh-56px)] w-full flex-col overflow-hidden rounded-md border-t shadow-lg md:max-h-[95dvh] md:max-w-xl md:border-2'
          onClick={(e) => e.stopPropagation()}
        >
          <div className='flex shrink-0 flex-col gap-1.5 p-4 pb-0 sm:px-6'>
            <div className='flex items-center justify-between gap-3'>
              <h2 className='text-2xl font-bold'>Edit Records</h2>
              <button type='button' aria-label='Close' onClick={close} disabled={editor.transaction.phase !== 'idle'}>
                <Cross className='h-3.5 w-3.5' />
              </button>
            </div>
            <TabSelector
              tabs={[
                { label: 'Configurations', value: 'configurations' },
                { label: 'Names', value: 'names' },
              ]}
              selectedTab={tab}
              setSelectedTab={setTab}
            />
          </div>
          <div className='flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain p-4 sm:px-6'>
            {!editor.account && <p className='text-neutral'>Connect your wallet to edit records.</p>}
            {editor.walletChanged && <p className='text-grace'>Your wallet changed. Reopen the editor to continue.</p>}
            {!editor.data && editor.account && !editor.loading.isError && <RecordsSkeleton />}
            {editor.loading.isError && !editor.data && (
              <>
                <p className='text-red-400' role='alert'>
                  {editor.loading.error.message}
                </p>
                <SecondaryButton onClick={() => editor.loading.refetch()}>Retry loading</SecondaryButton>
              </>
            )}
            {!!editor.data?.errors.length && (
              <div className='border-tertiary bg-secondary flex flex-col gap-3 rounded-md border p-3'>
                <p className='text-grace'>
                  These names could not be loaded and will not be changed. Reopen the editor to retry.
                </p>
                {editor.data.errors.map((error) => (
                  <div key={error.name} className='flex flex-col gap-1'>
                    <SelectedName name={error.name} />
                    <p className='text-neutral text-sm wrap-break-word'>{error.message}</p>
                  </div>
                ))}
              </div>
            )}
            {editor.resolvers.map((resolver) => (
              <ResolverConfigurations
                key={resolver.address}
                resolver={resolver}
                label={resolverLabel(preferences.data, resolver.address)}
                editor={editor}
                tab={tab}
                onSelect={select}
              />
            ))}
            {editor.completed.length > 0 && (
              <p className='text-primary' role='status'>
                Changes saved for {editor.completed.length} resolver{editor.completed.length === 1 ? '' : 's'}.
                Confirmed transactions will not be submitted again.
              </p>
            )}
          </div>
          <div className='border-tertiary flex shrink-0 flex-col gap-2 border-t p-4 sm:px-6'>
            {(editor.validationError || editor.error) && (
              <p className='text-sm text-red-400' role='alert'>
                {editor.validationError || editor.error}
              </p>
            )}
            {editor.hasChanges && (
              <p className='text-neutral text-center text-sm'>
                {editor.changedGroups.length} configuration{editor.changedGroups.length === 1 ? '' : 's'} edited ·{' '}
                {editor.changedNames.length} assignment{editor.changedNames.length === 1 ? '' : 's'} changed ·{' '}
                {editor.changedResolvers.length} transaction{editor.changedResolvers.length === 1 ? '' : 's'}
              </p>
            )}
            <PrimaryButton
              className='w-full'
              disabled={editor.locked || !editor.hasChanges || !!editor.validationError}
              onClick={editor.save}
            >
              Save changes
            </PrimaryButton>
            <SecondaryButton className='w-full' onClick={close}>
              Close
            </SecondaryButton>
          </div>
        </div>
      </div>
      {discard && (
        <DiscardChangesModal
          description={
            discard === 'close'
              ? undefined
              : 'Switching the last selected name away from this configuration will discard its unsaved record edits.'
          }
          onCancel={() => setDiscard(undefined)}
          onDiscard={() => {
            if (discard === 'close') onClose()
            else editor.selectConfiguration(discard.name, discard.value)
            setDiscard(undefined)
          }}
        />
      )}
    </>
  )
}

export default V2BulkEditRecordsModal
