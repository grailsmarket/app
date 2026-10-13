'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { confirmLeavingRecords } from '@/hooks/ens-v2/useDraftGuard'
import { useAccount } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { activeChain } from '@/constants/web3/chain'
import { ensApi } from '@/api/ens-v2'
import { useConfiguration, useResolver, resolverKey } from '@/hooks/ens-v2/useResolverData'
import { useResolverOperation } from '@/hooks/ens-v2/useResolverOperation'
import { ConfigurationEditor, SwitchConfiguration } from '@/components/ens-v2/configurationDetail'
import CreateConfiguration from '@/components/ens-v2/createConfiguration'
import ResolverPicker from '@/components/ens-v2/resolverPicker'
import { Notice, AddressLabel, buttonClass, OperationStatus } from '@/components/ens-v2/ui'
import { configurationPath } from '@/types/ens-v2'
import { isAddress } from 'viem'
import { setNameResolver } from '@/utils/web3/resolver-transactions'
import { useAppDispatch } from '@/state/hooks'
import { openMigrationModal } from '@/state/reducers/modals/migrationModal'
import type { EditRecordsModalProps } from './editRecordsModal'

export function RecordsModalFrame({
  name,
  children,
  onClose,
}: {
  name: string
  children: ReactNode
  onClose: () => void
}) {
  return (
    <div className='fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm md:items-center md:p-4'>
      <div
        role='dialog'
        aria-modal='true'
        aria-label={`Edit records for ${name}`}
        className='border-tertiary bg-background flex max-h-[90dvh] w-full max-w-3xl flex-col gap-5 overflow-y-auto rounded-t-xl border p-5 md:rounded-xl'
      >
        <div className='flex items-center justify-between gap-4'>
          <h2 className='text-xl font-semibold'>{name}</h2>
          <button
            className={buttonClass}
            onClick={() => {
              if (confirmLeavingRecords()) onClose()
            }}
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function V2Content({ name, defaultTab, onClose }: EditRecordsModalProps) {
  const dispatch = useAppDispatch()
  const { address } = useAccount()
  const context = useQuery({
    queryKey: [...resolverKey(address), 'name-context', name],
    queryFn: () => ensApi.name(activeChain.id, name),
    retry: false,
  })
  const resolver = useResolver(context.data?.resolver)
  const configuration = useConfiguration(context.data?.resolver, context.data?.effectiveRecordId ?? undefined)
  const [mode, setMode] = useState<'edit' | 'create' | 'switch' | 'resolver'>(
    defaultTab === 'roles' ? 'resolver' : 'edit'
  )
  const [copy, setCopy] = useState(false)
  const [selectedResolver, setSelectedResolver] = useState<string | null>(null)
  const operation = useResolverOperation()
  if (context.isPending) return <Notice>Loading the name’s resolver and configuration…</Notice>
  if (context.error) return <Notice error>{context.error.message}</Notice>
  const data = context.data
  const supported = data.resolverKind === 'permissioned' && resolver.data?.supported
  return (
    <>
      <div>
        {resolver.data?.label && <p>{resolver.data.label}</p>}
        <AddressLabel address={data.resolver} />
      </div>
      {data.resolverKind !== 'permissioned' && (
        <button
          className={buttonClass}
          onClick={() => {
            onClose()
            dispatch(openMigrationModal([name]))
          }}
        >
          Set up V2 configurations with the migration assistant
        </button>
      )}
      {data.inheritedResolver && (
        <Notice>
          This name inherits its resolver. Assigning its own resolver requires permission in the registry that holds
          this name.
        </Notice>
      )}
      <div className='flex flex-wrap gap-2' role='tablist' aria-label='Record actions'>
        {(
          [
            ['edit', 'Edit records'],
            ['create', 'Create separate configuration'],
            ['switch', 'Change configuration'],
            ['resolver', 'Change resolver'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            role='tab'
            aria-selected={mode === value}
            className={`${buttonClass} ${mode === value ? 'text-primary' : ''}`}
            onClick={() => {
              if (confirmLeavingRecords()) setMode(value)
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {mode === 'resolver' ? (
        <div className='flex flex-col gap-4'>
          <Notice>
            Changing the resolver changes where this name reads all its records. Records are not copied automatically.
            The selected resolver can be any address.
          </Notice>
          <ResolverPicker value={selectedResolver ?? data.resolver} onChange={setSelectedResolver} />
          <button
            className={`${buttonClass} self-start`}
            disabled={
              !selectedResolver ||
              !isAddress(selectedResolver) ||
              selectedResolver.toLowerCase() === data.resolver.toLowerCase() ||
              operation.isPending ||
              operation.isSuccess
            }
            onClick={() =>
              operation.mutate(async ({ client, wallet, v2, onHash }) => ({
                receipt: await setNameResolver(client, wallet, data, selectedResolver as `0x${string}`, onHash, v2),
              }))
            }
          >
            Confirm resolver change
          </button>
          <OperationStatus operation={operation} />
          {resolver.data && (
            <Link className='text-primary underline' href={`/settings/resolvers/${activeChain.id}/${data.resolver}`}>
              Manage resolver permissions
            </Link>
          )}
        </div>
      ) : !supported ? (
        <Notice>
          {resolver.error?.message ||
            (resolver.isPending && data.resolverKind === 'permissioned'
              ? 'Loading resolver permissions…'
              : 'This resolver does not support permissioned configurations. Choose a supported resolver to use the V2 configuration editor.')}
        </Notice>
      ) : mode === 'switch' ? (
        <SwitchConfiguration
          key={data.explicitRecordId}
          name={name}
          resolver={resolver.data!}
          currentId={data.effectiveRecordId}
          linkMode={data.explicitRecordId === '0' ? 'default' : 'explicit'}
        />
      ) : mode === 'create' ? (
        <div className='flex flex-col gap-4'>
          <label className='flex gap-2'>
            <input
              type='checkbox'
              checked={copy}
              onChange={(event) => setCopy(event.target.checked)}
              disabled={!configuration.data?.recordsComplete}
            />
            Copy current records
          </label>
          <CreateConfiguration
            key={copy ? 'copy' : 'empty'}
            resolver={resolver.data!}
            name={name}
            source={copy ? configuration.data : undefined}
          />
        </div>
      ) : !data.effectiveRecordId ? (
        <Notice>
          This name has no explicit configuration and the resolver has no default records. Create a separate
          configuration to add records.
        </Notice>
      ) : configuration.isPending ? (
        <Notice>Loading records…</Notice>
      ) : configuration.error ? (
        <Notice error>{configuration.error.message}</Notice>
      ) : (
        <>
          <Notice>
            {data.explicitRecordId === '0'
              ? 'This name follows the resolver default.'
              : `Explicitly linked to Configuration ${data.explicitRecordId}.`}{' '}
            Edit shared records here, or create a separate configuration for this name.
          </Notice>
          <ConfigurationEditor configuration={configuration.data} resolver={resolver.data!} />
          <Link
            className='text-primary underline'
            href={configurationPath(activeChain.id, data.resolver, data.effectiveRecordId)}
          >
            Open configuration settings
          </Link>
        </>
      )}
    </>
  )
}

export default function V2EditRecordsModal(props: EditRecordsModalProps) {
  return (
    <RecordsModalFrame name={props.name} onClose={props.onClose}>
      <V2Content {...props} />
    </RecordsModalFrame>
  )
}
