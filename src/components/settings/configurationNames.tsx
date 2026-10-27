'use client'

import { NamesSkeleton, TableRowsSkeleton } from '@/components/ui/ensSkeletons'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAccount } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import type { Address } from 'viem'
import TrashIcon from 'public/icons/trash.svg'
import NameImage from '@/components/ui/nameImage'
import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'
import Textarea from '@/components/ui/textarea'
import Input from '@/components/ui/input'
import Dropdown from '@/components/ui/dropdown'
import { useConfigurationNamePage } from '@/hooks/settings/useConfigurationNamePage'
import { useDebounce } from '@/hooks/useDebounce'
import { useSettingsTransaction } from '@/hooks/settings/useSettingsTransaction'
import { roleErrorText } from '@/hooks/records/useV2Roles'
import {
  mergeNameAssignments,
  nameAssignmentSteps,
  prepareNameAssignment,
  previewNameAssignments,
  type NameAssignment,
} from '@/utils/settings/nameAssignments'
import { config } from '@/lib/config'
import { matchesConfigurationName } from '@/utils/settings/resolverData'
import { cn } from '@/utils/tailwind'
import OwnedNamePicker from './ownedNamePicker'
import { useSettingsDirty } from '@/hooks/settings/useSettingsDirty'
import { QueryError, SettingsNotice, tableClass, tdClass, thClass, trClass } from './shared'
import { listNames } from './transactionScreens'
import { useConfigurationPreferences } from '@/hooks/settings/useResolverPreferences'
import { configurationName, resolverDefaultName } from '@/utils/settings/labels'

interface ConfigurationNamesProps {
  resolver: Address
  id?: bigint
}

const ConfigurationNames: React.FC<ConfigurationNamesProps> = ({ resolver, id }) => {
  const preferences = useConfigurationPreferences(resolver)
  const { address } = useAccount()
  const queries = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const q = useDebounce(search.trim(), 250)
  const pageSize = 20
  const data = useConfigurationNamePage({ resolver, id, q, offset: page * pageSize, limit: pageSize })
  const transaction = useSettingsTransaction()
  const [input, setInput] = useState('')
  const [source, setSource] = useState<'owned' | 'manual'>('owned')
  const [resolverTargetId, setResolverTargetId] = useState('0')
  const targetId = id?.toString() ?? resolverTargetId
  const [changes, setChanges] = useState<NameAssignment[]>([])
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string>()
  const checkingNames = useRef(false)
  const locked = transaction.busy || transaction.pending
  const loading = data.loading || q !== search.trim()

  useEffect(() => {
    if (!loading && page > 0 && page * pageSize >= data.total)
      setPage(Math.max(0, Math.ceil(data.total / pageSize) - 1))
  }, [loading, data.total, page])

  useSettingsDirty(!!input.trim() || changes.length > 0, transaction.busy || transaction.submitted, changes.length)

  const queue = async (names: string[], target: bigint, clearInput = false, action: 'add' | 'unlink' = 'add') => {
    if (!address || !data.catalog || checkingNames.current || locked) return false

    checkingNames.current = true
    setChecking(true)
    setError(undefined)

    try {
      if (target < BigInt(0) || target > data.catalog.recordCount)
        throw new Error('Select an available configuration, or use the resolver default.')

      const added: NameAssignment[] = []
      const uniqueNames = [...new Set(names)]

      for (let offset = 0; offset < uniqueNames.length; offset += 5) {
        const batch = await Promise.all(
          uniqueNames
            .slice(offset, offset + 5)
            .map((name) =>
              prepareNameAssignment(data.client, resolver, config.ensV2Registry, address, name, target, queries)
            )
        )

        added.push(...batch)
      }

      if (id === undefined && action === 'add') {
        const assigned = added.find(
          (assignment) => assignment.binding.resolver.toLowerCase() === resolver.toLowerCase()
        )

        if (assigned) throw new Error(`${assigned.name} already uses this resolver.`)
      }

      data.rememberNames(added.map((item) => item.name))
      setChanges((previous) => mergeNameAssignments(previous, added, resolver))

      if (added.some((item) => !data.items.some((name) => name.name === item.name))) {
        setPage(0)
        if (added.some((item) => !item.name.toLowerCase().includes(q.toLowerCase()))) setSearch('')
      }

      if (clearInput) setInput('')

      return true
    } catch (error) {
      setError(roleErrorText(error))

      return false
    } finally {
      checkingNames.current = false
      setChecking(false)
    }
  }

  const save = async () => {
    const steps = nameAssignmentSteps(data.client, resolver, config.ensV2Registry, changes)
    steps[steps.length - 1].confirmed = () => setChanges([])
    const names = changes.map((change) => change.name)
    const done = await transaction.run(steps, {
      title: 'Name Assignments',
      successMessage:
        names.length === 1
          ? `${names[0]} now uses this resolver and its configuration.`
          : `${listNames(names)} now use this resolver and their configurations.`,
    })

    if (done) setChanges([])
  }

  if (data.state.isError) return <QueryError error={data.state.error} retry={() => data.state.refetch()} />
  if (!data.catalog) return <NamesSkeleton />

  const pageChanges = changes.filter((change) => {
    const wasAssigned =
      change.binding.resolver.toLowerCase() === resolver.toLowerCase() &&
      matchesConfigurationName(
        {
          name: change.name,
          recordId: change.initialId,
          effectiveId: change.initialId || data.catalog!.defaultRecordId,
        },
        id,
        q
      )

    return data.items.some((name) => name.name === change.name) || (page === 0 && !wasAssigned)
  })
  const preview = previewNameAssignments(data.items, pageChanges, data.catalog.defaultRecordId)
  const assignedNames =
    id === undefined
      ? [...data.allNames.map((name) => name.name), ...changes.map((change) => change.name)]
      : [
          ...preview.filter((name) => name.recordId.toString() === targetId).map((name) => name.name),
          ...changes.filter((change) => change.id.toString() === targetId).map((change) => change.name),
        ]
  const visible = preview.filter((name) => matchesConfigurationName(name, id, q))
  const configurationOptions = [
    { value: '0', label: `Use ${resolverDefaultName(preferences.data, data.catalog.defaultRecordId)}` },
  ]

  if (id === undefined) {
    for (let recordId = BigInt(1); recordId <= data.catalog.recordCount; recordId++) {
      configurationOptions.push({
        value: recordId.toString(),
        label: `${configurationName(preferences.data, recordId)}${recordId === data.catalog.defaultRecordId ? ' (resolver default)' : ''}`,
      })
    }
  }

  return (
    <div className='flex flex-col'>
      {data.fallback && data.names.isError && <QueryError error={data.names.error} retry={data.retry} />}
      {data.fallback && !!data.names.data?.failed && (
        <SettingsNotice>
          Could not verify {data.names.data.failed} names. The list is incomplete.{' '}
          <button className='text-primary cursor-pointer underline' onClick={() => data.names.refetch()}>
            Retry
          </button>
        </SettingsNotice>
      )}
      <Input
        label='Search'
        value={search}
        maxLength={255}
        onChange={(event) => {
          setSearch(event.target.value)
          setPage(0)
        }}
        placeholder={`Search names using this ${id === undefined ? 'resolver' : 'configuration'}`}
        className='mb-3'
      />
      {/* {loading ? (
        <p className='text-neutral text-lg'>Checking current name assignments…</p>
      ) : (
        <p className='text-neutral text-sm'>
          {data.total} {data.fallback ? 'known ' : ''}
          {data.total === 1 ? 'name' : 'names'}
          {q ? ' matching your search' : ''}
          {changes.length > 0 && ` · ${changes.length} unsaved ${changes.length === 1 ? 'change' : 'changes'}`}
        </p>
      )} */}
      <div className='overflow-x-auto'>
        <table className={tableClass} aria-busy={loading}>
          {loading && <caption className='sr-only'>Loading name assignments…</caption>}
          <thead>
            <tr>
              {['Name', 'Configuration', ''].map((label) => (
                <th key={label} className={thClass}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((name, i) => (
              <tr key={name.name} className={trClass(i, visible)}>
                <td className={tdClass}>
                  <Link
                    className='hover:text-primary flex w-fit items-center gap-2'
                    href={`/${encodeURIComponent(name.name)}`}
                  >
                    <NameImage
                      name={name.name}
                      tokenId=''
                      version={2}
                      expiryDate={null}
                      forceRegStatus='Registered'
                      width={32}
                      height={32}
                      className='shrink-0'
                    />
                    {name.name}
                  </Link>
                  {name.inherited && <span className='text-neutral ml-2 text-sm'>Inherited resolver</span>}
                </td>
                <td className={tdClass}>
                  <div className='flex flex-wrap items-center gap-2'>
                    <span className='bg-secondary rounded-sm px-2 py-1 text-sm'>
                      {name.recordId === BigInt(0) ? 'Resolver default' : `Explicit · ${name.recordId}`}
                    </span>
                    {changes.some((change) => change.name === name.name) && (
                      <span className='text-neutral text-sm'>Unsaved</span>
                    )}
                  </div>
                </td>
                <td className={tdClass}>
                  {(name.recordId !== BigInt(0) || changes.some((change) => change.name === name.name)) && (
                    <button
                      type='button'
                      aria-label={`Remove ${name.name}`}
                      title={
                        changes.some((change) => change.name === name.name)
                          ? 'Discard this change'
                          : 'Remove link and use resolver default'
                      }
                      className='flex h-8 w-8 cursor-pointer items-center justify-center opacity-70 transition-opacity hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-40'
                      disabled={!data.catalog?.canLink || locked || checking}
                      onClick={() => {
                        if (changes.some((change) => change.name === name.name))
                          setChanges((previous) => previous.filter((change) => change.name !== name.name))
                        else void queue([name.name], BigInt(0), false, 'unlink')
                      }}
                    >
                      <Image src={TrashIcon} alt='' width={16} height={18} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {loading && <TableRowsSkeleton columns={3} nameImage actionColumn rows={visible.length ? 1 : 4} />}
          </tbody>
        </table>
      </div>
      {!visible.length && !loading && (
        <p className='text-neutral px-3 py-2 text-lg'>
          {q
            ? 'No names match your search.'
            : `No known names use this ${id === undefined ? 'resolver' : 'configuration'}.`}
        </p>
      )}
      {(page > 0 || data.total > pageSize) && (
        <div className='my-3 flex items-center justify-end gap-3'>
          <SecondaryButton disabled={page === 0 || loading} onClick={() => setPage(page - 1)}>
            Previous
          </SecondaryButton>
          <span className='text-neutral'>Page {page + 1}</span>
          <SecondaryButton disabled={(page + 1) * pageSize >= data.total || loading} onClick={() => setPage(page + 1)}>
            Next
          </SecondaryButton>
        </div>
      )}
      {data.catalog.canLink ? (
        <div className='border-tertiary flex flex-col gap-4 border-t pt-4'>
          <div className='flex flex-col gap-2'>
            <div className='border-tertiary mb-2 flex gap-2 border-b' aria-label='Add names from'>
              {(['owned', 'manual'] as const).map((item) => (
                <button
                  key={item}
                  type='button'
                  aria-pressed={source === item}
                  disabled={locked || checking}
                  onClick={() => setSource(item)}
                  className={cn(
                    'cursor-pointer border-b-2 px-3 pb-2 text-lg font-semibold disabled:cursor-not-allowed',
                    source === item
                      ? 'border-primary text-primary'
                      : 'text-neutral hover:text-foreground border-transparent'
                  )}
                >
                  {item === 'owned' ? 'Your names' : 'Enter names'}
                </button>
              ))}
            </div>
            {id === undefined && (
              <Dropdown
                label='Configuration'
                value={resolverTargetId}
                options={configurationOptions}
                onSelect={(value) => setResolverTargetId(String(value))}
                disabled={locked || checking}
              />
            )}
            {address && (
              <div hidden={source !== 'owned'}>
                <OwnedNamePicker
                  address={address}
                  assignedNames={assignedNames}
                  hideAssigned={id === undefined}
                  excludeResolver={id === undefined && data.fallback ? resolver : undefined}
                  disabled={locked || checking || !targetId || (id === undefined && data.loading)}
                  checking={checking}
                  onAdd={(names) => queue(names, BigInt(targetId))}
                />
              </div>
            )}
            <div className={cn('flex items-center gap-2', source !== 'manual' && 'hidden')}>
              <Textarea
                label='Names'
                rows={1}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                disabled={locked || checking}
                placeholder={'name.eth, sub.name.eth'}
              />
              <SecondaryButton
                className='hidden h-12! w-28 items-center justify-center text-nowrap sm:flex'
                disabled={!input.trim() || !targetId || checking || locked}
                onClick={() => queue(input.split(/[\s,]+/).filter(Boolean), BigInt(targetId), true)}
              >
                {checking ? 'Checking names…' : 'Add names'}
              </SecondaryButton>
            </div>
          </div>
          <SecondaryButton
            className={cn('sm:hidden', source !== 'manual' && 'hidden')}
            disabled={!input.trim() || !targetId || checking || locked}
            onClick={() => queue(input.split(/[\s,]+/).filter(Boolean), BigInt(targetId), true)}
          >
            {checking ? 'Checking names…' : 'Add names'}
          </SecondaryButton>
        </div>
      ) : (
        <SettingsNotice>You need the resolver’s Link permission to change name assignments.</SettingsNotice>
      )}
      {error && <SettingsNotice error>{error}</SettingsNotice>}
      <div className='border-tertiary mt-4 flex gap-3 border-t pt-4'>
        <PrimaryButton className='w-1/2' onClick={save} disabled={!changes.length || locked || checking}>
          {transaction.busy ? 'Saving changes…' : 'Save changes'}
        </PrimaryButton>
        <SecondaryButton
          className='w-1/2'
          disabled={!changes.length || locked || checking}
          onClick={() => setChanges([])}
        >
          Reset changes
        </SecondaryButton>
      </div>
    </div>
  )
}

export default ConfigurationNames
