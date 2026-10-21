'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAccount } from 'wagmi'
import type { Address } from 'viem'
import TrashIcon from 'public/icons/trash.svg'
import NameImage from '@/components/ui/nameImage'
import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'
import Textarea from '@/components/ui/textarea'
import Input from '@/components/ui/input'
import { useConfigurationNames } from '@/hooks/settings/useConfigurationNames'
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
import { useSettingsDirty } from './navigationGuard'
import { QueryError, SettingsNotice, TransactionStatus, tableClass, tdClass, thClass, trClass } from './shared'

export default function ConfigurationNames({ resolver, id }: { resolver: Address; id?: bigint }) {
  const { address } = useAccount()
  const data = useConfigurationNames(resolver)
  const transaction = useSettingsTransaction()
  const [input, setInput] = useState('')
  const [resolverTargetId, setResolverTargetId] = useState('0')
  const targetId = id?.toString() ?? resolverTargetId
  const [changes, setChanges] = useState<NameAssignment[]>([])
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string>()
  const locked = transaction.busy || transaction.pending

  useSettingsDirty(!!input.trim() || changes.length > 0, transaction.busy || transaction.submitted, changes.length)

  const queue = async (names: string[], target: bigint, clearInput = false) => {
    if (!address || !data.catalog) return

    setChecking(true)
    setError(undefined)

    try {
      if (target < BigInt(0) || target > data.catalog.recordCount)
        throw new Error('Enter an existing configuration ID, or 0 to use the resolver default.')

      const added: NameAssignment[] = []
      for (const name of [...new Set(names)])
        added.push(await prepareNameAssignment(data.client, resolver, config.ensV2Registry, address, name, target))

      data.rememberNames(added.map((item) => item.name))
      setChanges((previous) => mergeNameAssignments(previous, added, resolver))

      if (clearInput) setInput('')
    } catch (error) {
      setError(roleErrorText(error))
    } finally {
      setChecking(false)
    }
  }

  const save = async () => {
    const steps = nameAssignmentSteps(data.client, resolver, config.ensV2Registry, changes)
    steps[steps.length - 1].confirmed = () => setChanges([])
    if (await transaction.run(steps)) setChanges([])
  }

  if (data.state.isError) return <QueryError error={data.state.error} retry={() => data.state.refetch()} />
  if (!data.catalog) return <SettingsNotice>Loading name links…</SettingsNotice>

  const visible = previewNameAssignments(data.names.data?.names ?? [], changes, data.catalog.defaultRecordId).filter(
    (name) => id === undefined || (id === BigInt(0) ? name.recordId === BigInt(0) : name.effectiveId === id)
  )

  return (
    <div className='flex flex-col'>
      {data.history.isError && <QueryError error={data.history.error} retry={() => data.history.refetch()} />}
      {data.names.isError && <QueryError error={data.names.error} retry={() => data.names.refetch()} />}
      {!!data.names.data?.failed && (
        <SettingsNotice>
          Could not verify {data.names.data.failed} names. The list is incomplete.{' '}
          <button className='text-primary cursor-pointer underline' onClick={() => data.names.refetch()}>
            Retry
          </button>
        </SettingsNotice>
      )}
      {data.names.isLoading || data.history.isLoading ? (
        <p className='text-neutral text-lg'>Checking current name assignments…</p>
      ) : null}
      <div className='overflow-x-auto'>
        <table className={tableClass}>
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
                        else void queue([name.name], BigInt(0))
                      }}
                    >
                      <Image src={TrashIcon} alt='' width={16} height={18} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!visible.length && !data.names.isLoading && (
        <p className='text-neutral px-3 py-2 text-lg'>No known names use this configuration.</p>
      )}
      {data.catalog.canLink ? (
        <div className='border-tertiary flex flex-col gap-4 border-t pt-5'>
          <h3 className='text-xl font-semibold'>Assign names</h3>
          <div className='flex flex-col gap-2'>
            <Textarea
              label='Names'
              rows={1}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={locked || checking}
              placeholder={'name.eth, sub.name.eth'}
            />
            {id === undefined && (
              <Input
                label='Configuration ID'
                labelClassName='min-w-36'
                value={resolverTargetId}
                onChange={(event) => {
                  if (/^\d*$/.test(event.target.value)) setResolverTargetId(event.target.value)
                }}
                disabled={locked || checking}
                placeholder='0 for resolver default'
              />
            )}
          </div>
          <SecondaryButton
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
      <TransactionStatus transaction={transaction} />
      <div className='flex flex-wrap gap-3 pt-4'>
        <PrimaryButton onClick={save} disabled={!changes.length || locked || checking}>
          {transaction.busy ? 'Saving changes…' : 'Save changes'}
        </PrimaryButton>
        <SecondaryButton disabled={!changes.length || locked || checking} onClick={() => setChanges([])}>
          Reset changes
        </SecondaryButton>
      </div>
    </div>
  )
}
