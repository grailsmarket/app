'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { ShortArrow } from 'ethereum-identity-kit'
import type { Address } from 'viem'
import { encodeFunctionData, zeroHash } from 'viem'
import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'
import RecordForm from '@/components/modal/records/v2/recordForm'
import { useConfigurationEditor } from '@/hooks/settings/useConfigurationEditor'
import { useSettingsTransaction } from '@/hooks/settings/useSettingsTransaction'
import { useResolverCatalog } from '@/hooks/settings/useResolverDirectory'
import { PERMISSIONED_RESOLVER_ABI as abi } from '@/constants/web3/abi/PermissionedResolver'
import { cn } from '@/utils/tailwind'
import CheckCircle from 'public/icons/check-circle.svg'
import { useSettingsDirty } from './navigationGuard'
import {
  QueryError,
  ResolverAddress,
  SettingsNotice,
  configurationPath,
  resolverPath,
  secondaryLinkClass,
} from './shared'
import ConfigurationNames from './configurationNames'
import { ROOT_NAME } from '@/constants/ens/resolver'

interface ConfigurationRecordsProps {
  resolver: Address
  id: bigint
  mode: 'edit' | 'new' | 'copy'
}

const ConfigurationRecords: React.FC<ConfigurationRecordsProps> = ({ resolver, id, mode }) => {
  const editor = useConfigurationEditor(resolver, id, mode)
  const transaction = editor.transaction
  const busy = transaction.busy || transaction.pending

  useSettingsDirty(
    editor.changed || (mode === 'copy' && editor.createdId === undefined),
    transaction.busy || transaction.submitted
  )

  if (editor.state.isError) return <QueryError error={editor.state.error} retry={() => editor.state.refetch()} />
  if (editor.catalog && id > editor.catalog.recordCount)
    return <SettingsNotice error>This configuration does not exist.</SettingsNotice>
  if (editor.recordsQuery.isError)
    return <QueryError error={editor.recordsQuery.error} retry={() => editor.recordsQuery.refetch()} />
  if (!editor.recordsQuery.data || !editor.catalog)
    return <SettingsNotice>Loading records and permissions…</SettingsNotice>
  if (editor.createdId !== undefined)
    return (
      <div className='flex flex-col items-center gap-4 py-8'>
        <Image src={CheckCircle} alt='Success' width={64} height={64} />
        <h3 className='text-xl font-bold'>Configuration created</h3>
        {editor.error && <SettingsNotice error>{editor.error}</SettingsNotice>}
        <Link
          className='text-primary text-lg underline'
          href={editor.createdId > BigInt(0) ? configurationPath(resolver, editor.createdId) : resolverPath(resolver)}
        >
          {editor.createdId > BigInt(0) ? `Open Configuration ${editor.createdId}` : 'View configurations'}
        </Link>
      </div>
    )

  const empty = !editor.records.some((row) => row.value)
  const editable = editor.records.some((row) => row.editable)
  const copyBlocked =
    mode === 'copy' && (!editor.catalog.historyComplete || editor.records.some((row) => !!row.value && !row.editable))

  return (
    <div className='flex max-w-3xl flex-col gap-5'>
      {mode === 'edit' ? (
        <SettingsNotice>
          Changes apply to every name using this configuration
          {id === BigInt(0) || id === editor.catalog.defaultRecordId
            ? ', including names using the resolver default'
            : ''}
          . Duplicate it to edit a separate copy.
        </SettingsNotice>
      ) : (
        <SettingsNotice>
          {mode === 'copy'
            ? 'Create an independent copy in this resolver. Name assignments stay with the original configuration.'
            : 'Create a configuration now and link names to it later.'}
        </SettingsNotice>
      )}
      {mode !== 'edit' && empty && <p className='text-grace text-lg'>You are creating an empty configuration.</p>}
      {!editor.catalog.historyComplete && (
        <SettingsNotice>
          {editor.history.isLoading
            ? 'Discovering additional records… Standard records are available below.'
            : 'Additional record discovery is unavailable. Add a known record key to load it.'}
          {editor.history.isError && (
            <button className='text-primary ml-2 cursor-pointer underline' onClick={() => editor.history.refetch()}>
              Retry discovery
            </button>
          )}
        </SettingsNotice>
      )}
      {copyBlocked && (
        <SettingsNotice>
          Duplicating requires complete record discovery and permission to write every populated field.
        </SettingsNotice>
      )}
      <fieldset disabled={busy} className='flex min-w-0 flex-col gap-4 disabled:opacity-60'>
        <RecordForm
          name=''
          allowImageUpload={false}
          records={editor.records}
          updateRecord={editor.updateRecord}
          addRecord={editor.addRecord}
          isAdding={editor.adding}
        />
      </fieldset>
      {editor.error && <SettingsNotice error>{editor.error}</SettingsNotice>}
      <div className='border-tertiary flex items-center gap-3'>
        <PrimaryButton
          className='w-1/2'
          disabled={busy || editor.adding || !editable || copyBlocked || (mode === 'edit' && !editor.changed)}
          onClick={editor.save}
        >
          {transaction.busy ? 'Saving records…' : mode === 'edit' ? 'Save changes' : 'Create configuration'}
        </PrimaryButton>
        <SecondaryButton className='w-1/2' disabled={busy || !editor.changed} onClick={editor.reset}>
          Reset changes
        </SecondaryButton>
        {transaction.phase === 'success' && !editor.changed && (
          <Image src={CheckCircle} alt='Records saved' width={28} height={28} />
        )}
      </div>
    </div>
  )
}

interface SetDefaultProps {
  resolver: Address
  id: bigint
  review: boolean
  setReview: (review: boolean) => void
}

const SetDefault: React.FC<SetDefaultProps> = ({ resolver, id, review, setReview }) => {
  const { catalog, client } = useResolverCatalog(resolver)
  const transaction = useSettingsTransaction()

  useSettingsDirty(review, transaction.busy || transaction.submitted)

  if (!catalog?.canLink || id === BigInt(0) || id === catalog.defaultRecordId) return null
  if (!review && transaction.phase === 'idle') return null

  const save = () =>
    transaction.run([
      {
        label: 'Set default configuration',
        prepare: async () => {
          const current = await client.readContract({
            address: resolver,
            abi,
            functionName: 'getRecordId',
            args: [zeroHash],
          })
          if (current !== catalog.defaultRecordId)
            throw new Error('The resolver default changed. Reload before continuing.')
          return {
            to: resolver,
            data: encodeFunctionData({ abi, functionName: 'linkToRecord', args: [ROOT_NAME, id] }),
          }
        },
        confirmed: () => setReview(false),
      },
    ])

  return (
    <div className='flex flex-col gap-3'>
      {review && (
        <SettingsNotice>
          <p>
            All names using the resolver default will now use Configuration {id.toString()}. Explicit links stay
            unchanged.
          </p>
          <div className='mt-4 flex flex-wrap gap-3'>
            <PrimaryButton disabled={transaction.busy || transaction.pending} onClick={save}>
              Confirm default
            </PrimaryButton>
            <SecondaryButton disabled={transaction.busy || transaction.submitted} onClick={() => setReview(false)}>
              Cancel
            </SecondaryButton>
          </div>
        </SettingsNotice>
      )}
    </div>
  )
}

interface ConfigurationDetailProps {
  resolver: Address
  id: bigint
  mode?: 'edit' | 'new' | 'copy'
  tab?: string
}

const ConfigurationDetail: React.FC<ConfigurationDetailProps> = ({ resolver, id, mode = 'edit', tab = 'records' }) => {
  const [reviewDefault, setReviewDefault] = useState(false)

  const { catalog } = useResolverCatalog(resolver)
  const base = configurationPath(resolver, id)
  const title =
    mode === 'new'
      ? 'New configuration'
      : mode === 'copy'
        ? `Duplicate ${id === BigInt(0) ? 'default configuration' : `Configuration ${id}`}`
        : id === BigInt(0)
          ? 'Default configuration'
          : `Configuration ${id}`

  return (
    <div className='flex flex-col gap-4'>
      <Link
        className='text-neutral hover:text-primary flex w-fit items-center gap-2 text-lg'
        href={resolverPath(resolver)}
      >
        <ShortArrow className='h-3.5 w-3.5 -rotate-90' /> Configurations
      </Link>
      <div className=''>
        {mode === 'edit' && (
          <div className='flex w-full flex-wrap items-center justify-between gap-3'>
            <div className='flex flex-col gap-1'>
              <h2 className='text-2xl font-semibold'>{title}</h2>
              <div className='flex gap-1'>
                <p className='text-neutral text-lg font-medium'>Resolver:</p>
                <ResolverAddress address={resolver} />
              </div>
            </div>
            <div className='flex gap-2'>
              <Link className={secondaryLinkClass} href={`${base}/duplicate`}>
                New Copy
              </Link>
              {catalog?.canLink && id > BigInt(0) && id <= catalog.recordCount && id !== catalog.defaultRecordId && (
                <SecondaryButton disabled={reviewDefault} onClick={() => setReviewDefault(true)}>
                  Set Default
                </SecondaryButton>
              )}
            </div>
          </div>
        )}
      </div>
      {mode === 'edit' && (
        <SetDefault resolver={resolver} id={id} review={reviewDefault} setReview={setReviewDefault} />
      )}
      {id === BigInt(0) && mode === 'edit' && (
        <p className='text-neutral text-lg'>
          {catalog?.defaultRecordId
            ? `The resolver root currently points to onchain configuration ${catalog.defaultRecordId}.`
            : 'The default has no records yet. Its first write creates an onchain configuration.'}{' '}
          Names with no explicit link use this default.
        </p>
      )}
      <div className='flex min-w-0 flex-col gap-4'>
        {mode === 'edit' && (
          <nav aria-label='Configuration sections' className='border-tertiary flex gap-2 overflow-x-auto border-b'>
            {['records', 'names'].map((item) => (
              <Link
                key={item}
                href={`${base}${item === 'records' ? '' : '/names'}`}
                aria-current={tab === item ? 'page' : undefined}
                className={cn(
                  'border-b-2 px-3 pb-2 text-lg font-semibold capitalize',
                  tab === item ? 'border-primary text-primary' : 'text-neutral hover:text-foreground border-transparent'
                )}
              >
                {item}
              </Link>
            ))}
          </nav>
        )}
        <div className='flex min-w-0 flex-1 flex-col gap-6'>
          {tab === 'names' ? (
            <ConfigurationNames resolver={resolver} id={id} />
          ) : (
            <ConfigurationRecords resolver={resolver} id={id} mode={mode} />
          )}
        </div>
      </div>
    </div>
  )
}

export default ConfigurationDetail
