'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import Link from 'next/link'
import { useInfiniteQuery } from '@tanstack/react-query'
import type { Address } from 'viem'
import { useConfiguration, useConfigurations, useResolver, resolverKey } from '@/hooks/ens-v2/useResolverData'
import { useResolverOperation } from '@/hooks/ens-v2/useResolverOperation'
import { ensApi } from '@/api/ens-v2'
import { activeChain } from '@/constants/web3/chain'
import { normalizeName } from '@/lib/ens'
import { hasPermission, RESOLVER_ROLES } from '@/utils/web3/resolver-permissions'
import { confirmLeavingRecords } from '@/hooks/ens-v2/useDraftGuard'
import { recordChanges } from '@/utils/web3/resolver-records'
import {
  dnsName,
  newAnchor,
  linkCall,
  prepareConfigurationEdit,
  requireSupportedResolver,
  requireNameResolverPermission,
  sendResolverCalls,
  setNameResolver,
} from '@/utils/web3/resolver-transactions'
import { configurationPath, type Configuration, type ResolverSummary } from '@/types/ens-v2'
import RecordEditor from './recordEditor'
import CreateConfiguration from './createConfiguration'
import { AddressLabel, buttonClass, Field, inputClass, Notice, OperationStatus, PersonalLabel } from './ui'

export function ConfigurationEditor({
  configuration,
  resolver,
}: {
  configuration: Configuration
  resolver: ResolverSummary
}) {
  const { address } = useAccount()
  const operation = useResolverOperation()
  const [baseline, setBaseline] = useState(configuration)
  const [editingAnchor] = useState(newAnchor)
  return (
    <div className='flex flex-col gap-4'>
      <Notice>
        {configuration.nameCount} known names use this configuration ({configuration.explicitNameCount} explicit,{' '}
        {configuration.defaultNameCount} through the resolver default). Saving changes affects all of them.
      </Notice>
      {!configuration.recordsComplete && (
        <Notice>
          Some records are still being indexed. Existing fields can be edited, but a complete duplicate is not available
          yet.
        </Notice>
      )}
      <RecordEditor
        key={`${baseline.recordId}:${baseline.index.indexedThroughBlock}`}
        initial={baseline.records}
        grants={resolver.grants}
        account={address}
        busy={operation.isPending}
        readOnly={!resolver.supported || !configuration.anchor || operation.isSuccess}
        onSave={async (values) => {
          const changes = recordChanges(baseline.records, values)
          await operation.mutateAsync(async ({ client, wallet, account, v2, onHash }) => {
            await requireSupportedResolver(client, v2, resolver.address)
            const calls = await prepareConfigurationEdit(client, account, baseline, changes)
            return { receipt: await sendResolverCalls(client, wallet, resolver.address, calls, onHash) }
          })
        }}
      />
      {!operation.isSuccess && configuration.index.indexedThroughBlock !== baseline.index.indexedThroughBlock && (
        <button
          className={`${buttonClass} self-start`}
          onClick={() => {
            if (confirmLeavingRecords()) setBaseline(configuration)
          }}
        >
          Reload latest indexed records
        </button>
      )}
      {!configuration.anchor && (
        <Notice>
          This bundle has no known linked editing name. A resolver administrator needs to attach an editing name before
          it can be changed.
          {hasPermission(resolver.grants, address, RESOLVER_ROLES.link) && (
            <button
              className={`${buttonClass} mt-3`}
              disabled={operation.isPending || operation.isSuccess}
              onClick={() =>
                operation.mutate(async ({ client, wallet, v2, onHash }) => {
                  await requireSupportedResolver(client, v2, resolver.address)
                  return {
                    receipt: await sendResolverCalls(
                      client,
                      wallet,
                      resolver.address,
                      [linkCall(editingAnchor, configuration.recordId)],
                      onHash
                    ),
                    anchor: editingAnchor,
                  }
                })
              }
            >
              Attach an internal editing name
            </button>
          )}
        </Notice>
      )}
      <OperationStatus operation={operation} />
      {operation.isSuccess && (
        <button
          className={`${buttonClass} self-start`}
          disabled={
            BigInt(configuration.index.indexedThroughBlock) < (operation.data?.receipt.blockNumber ?? BigInt(0))
          }
          onClick={() => {
            setBaseline(configuration)
            operation.reset()
          }}
        >
          Continue editing indexed records
        </button>
      )}
    </div>
  )
}

export function SwitchConfiguration({
  name,
  resolver,
  currentId,
  linkMode,
  onChanged,
}: {
  name: string
  resolver: ResolverSummary
  currentId: string | null
  linkMode: 'explicit' | 'default'
  onChanged?: () => void
}) {
  const { address } = useAccount()
  const configurations = useConfigurations(resolver.address)
  const [selected, setSelected] = useState(linkMode === 'default' ? '0' : (currentId ?? '0'))
  const operation = useResolverOperation()
  const canLink = hasPermission(resolver.grants, address, RESOLVER_ROLES.link)
  const unchanged = selected === (linkMode === 'default' ? '0' : (currentId ?? '0'))
  return (
    <div className='flex flex-col gap-3'>
      <Field label='Configuration in this resolver'>
        <select
          className={inputClass}
          value={selected}
          disabled={!canLink || operation.isPending}
          onChange={(event) => {
            setSelected(event.target.value)
            operation.reset()
          }}
        >
          <option value='0'>
            Use resolver default
            {resolver.defaultRecordId ? ` (#${resolver.defaultRecordId})` : ' (no default configured)'}
          </option>
          {configurations.data?.pages
            .flatMap((page) => page.items)
            .map((configuration) => (
              <option key={configuration.recordId} value={configuration.recordId}>
                {configuration.label || `Configuration ${configuration.recordId}`}
                {configuration.isDefault ? ' · Default bundle (explicit link)' : ''}
              </option>
            ))}
        </select>
      </Field>
      {configurations.hasNextPage && (
        <button className={buttonClass} onClick={() => configurations.fetchNextPage()}>
          Load more configurations
        </button>
      )}
      {configurations.error && <Notice error>{configurations.error.message}</Notice>}
      {!canLink && <Notice>This wallet needs the resolver’s linking permission to change configuration.</Notice>}
      <p className='text-neutral text-sm'>
        {selected === '0'
          ? 'This name will follow future changes to the resolver default.'
          : 'This name will use all records from the selected configuration.'}
      </p>
      <button
        className={`${buttonClass} self-start`}
        disabled={!canLink || unchanged || operation.isPending || operation.isSuccess}
        onClick={() =>
          operation.mutate(
            async ({ client, wallet, v2, onHash }) => {
              await requireSupportedResolver(client, v2, resolver.address)
              return {
                receipt: await sendResolverCalls(
                  client,
                  wallet,
                  resolver.address,
                  [linkCall(dnsName(name), selected)],
                  onHash
                ),
              }
            },
            { onSuccess: onChanged }
          )
        }
      >
        Confirm configuration change
      </button>
      <OperationStatus operation={operation} />
    </div>
  )
}

function ConfigurationNames({ configuration, resolver }: { configuration: Configuration; resolver: ResolverSummary }) {
  const { address } = useAccount()
  const list = useInfiniteQuery({
    queryKey: [...resolverKey(address), 'names', resolver.address, configuration.recordId],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => ensApi.names(activeChain.id, resolver.address, configuration.recordId, pageParam),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
  })
  const [name, setName] = useState('')
  const [changing, setChanging] = useState<string | null>(null)
  const [review, setReview] = useState<Awaited<ReturnType<typeof ensApi.name>> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const operation = useResolverOperation()
  const canLink = hasPermission(resolver.grants, address, RESOLVER_ROLES.link)
  return (
    <div className='flex flex-col gap-4'>
      <Notice>
        Known active names only. Internal editing names and links left behind on previous resolvers are excluded.
      </Notice>
      {list.isPending && <Notice>Loading names…</Notice>}
      {list.error && <Notice error>{list.error.message}</Notice>}
      {list.data?.pages
        .flatMap((page) => page.items)
        .map((item) => (
          <div className='border-tertiary rounded-md border p-4' key={item.name}>
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <Link className='font-medium hover:underline' href={`/${item.name}`}>
                {item.name}
              </Link>
              <span className='text-neutral text-xs'>
                {item.linkMode === 'explicit' ? 'Explicit' : 'Resolver default'}
                {item.inheritedResolver ? ' · Inherited resolver' : ''}
              </span>
              <button
                className={buttonClass}
                disabled={!canLink}
                onClick={() => setChanging(changing === item.name ? null : item.name)}
              >
                Change
              </button>
            </div>
            {changing === item.name && (
              <div className='mt-4'>
                <SwitchConfiguration
                  name={item.name}
                  resolver={resolver}
                  currentId={configuration.recordId}
                  linkMode={item.linkMode}
                />
              </div>
            )}
          </div>
        ))}
      {list.data?.pages[0]?.items.length === 0 && <Notice>No known active names use this configuration.</Notice>}
      {list.hasNextPage && (
        <button className={buttonClass} disabled={list.isFetchingNextPage} onClick={() => list.fetchNextPage()}>
          Load more names
        </button>
      )}
      <div className='border-tertiary flex flex-col gap-3 border-t pt-5'>
        <Field label='Assign a name to this configuration'>
          <input
            className={inputClass}
            value={name}
            onChange={(event) => {
              setName(event.target.value)
              setReview(null)
            }}
            placeholder='name.eth'
          />
        </Field>
        <button
          className={`${buttonClass} self-start`}
          disabled={!canLink || operation.isPending}
          onClick={async () => {
            setError(null)
            try {
              const context = await ensApi.name(activeChain.id, normalizeName(name))
              if (context.version !== 'v2')
                throw new Error('Migrate this name to ENSv2 before assigning a V2 configuration.')
              setReview(context)
            } catch (cause) {
              setError(cause instanceof Error ? cause.message : 'Could not check this name.')
            }
          }}
        >
          Review assignment
        </button>
      </div>
      {review && (
        <Notice>
          <p>
            Assign {review.name} to Configuration {configuration.recordId}.
            {review.resolver.toLowerCase() !== resolver.address.toLowerCase() &&
              ' This also requires a separate transaction to change the name’s registry resolver.'}
          </p>
          <button
            className={`${buttonClass} mt-3`}
            disabled={operation.isPending || operation.isSuccess}
            onClick={() =>
              operation.mutate(async ({ client, wallet, v2, onHash }) => {
                await requireSupportedResolver(client, v2, resolver.address)
                if (review.resolver.toLowerCase() !== resolver.address.toLowerCase())
                  await requireNameResolverPermission(client, v2, wallet.account!.address, review, resolver.address)
                const receipt = await sendResolverCalls(
                  client,
                  wallet,
                  resolver.address,
                  [linkCall(dnsName(review.name), configuration.recordId)],
                  onHash
                )
                if (review.resolver.toLowerCase() !== resolver.address.toLowerCase())
                  return { receipt: await setNameResolver(client, wallet, review, resolver.address, onHash, v2) }
                return { receipt }
              })
            }
          >
            Confirm assignment
          </button>
        </Notice>
      )}
      {error && <Notice error>{error}</Notice>}
      <OperationStatus operation={operation} />
    </div>
  )
}

export default function ConfigurationDetail({
  resolver: resolverAddress,
  recordId,
  tab = 'records',
}: {
  resolver: Address
  recordId: string
  tab?: 'records' | 'names'
}) {
  const resolver = useResolver(resolverAddress)
  const configuration = useConfiguration(resolverAddress, recordId)
  const { address } = useAccount()
  const [duplicate, setDuplicate] = useState(false)
  const [reviewDefault, setReviewDefault] = useState(false)
  const operation = useResolverOperation()
  if (resolver.isPending || configuration.isPending) return <Notice>Loading configuration…</Notice>
  if (resolver.error || configuration.error)
    return <Notice error>{resolver.error?.message || configuration.error?.message}</Notice>
  const data = configuration.data
  const path = configurationPath(activeChain.id, resolverAddress, recordId)
  const canLink = hasPermission(resolver.data.grants, address, RESOLVER_ROLES.link)
  return (
    <div className='flex flex-col gap-5'>
      <div>
        <Link className='text-neutral text-sm hover:underline' href='/settings/records'>
          ← All configurations
        </Link>
        <h2 className='mt-3 text-2xl font-semibold'>
          {data.label || (data.isDefault ? 'Default Configuration' : `Configuration ${recordId}`)}{' '}
          <span className='text-neutral text-base'>#{recordId}</span>
        </h2>
        <AddressLabel address={resolverAddress} />
      </div>
      <PersonalLabel
        key={`${recordId}:${data.label}`}
        resolver={resolverAddress}
        recordId={recordId}
        initial={data.label}
      />
      <div className='flex flex-wrap gap-2'>
        <button className={buttonClass} disabled={!data.recordsComplete} onClick={() => setDuplicate(!duplicate)}>
          {duplicate ? 'Close duplicate' : 'Duplicate configuration'}
        </button>
        {!data.isDefault && (
          <button
            className={buttonClass}
            disabled={!canLink || operation.isPending || operation.isSuccess}
            onClick={() => setReviewDefault(true)}
          >
            Use as resolver default
          </button>
        )}
        {data.isDefault && <span className='text-primary px-3 py-2 text-sm'>Resolver default</span>}
      </div>
      {!data.isDefault && canLink && (
        <p className='text-neutral text-sm'>
          Changing the resolver default affects all names without an explicit configuration. Explicit links stay
          unchanged.
        </p>
      )}
      {reviewDefault && (
        <Notice>
          <p>Assign Configuration {recordId} as the resolver default for every name without an explicit link.</p>
          <button
            className={buttonClass}
            disabled={operation.isPending || operation.isSuccess}
            onClick={() =>
              operation.mutate(async ({ client, wallet, v2, onHash }) => {
                await requireSupportedResolver(client, v2, resolverAddress)
                return {
                  receipt: await sendResolverCalls(
                    client,
                    wallet,
                    resolverAddress,
                    [linkCall('0x00', recordId)],
                    onHash
                  ),
                }
              })
            }
          >
            Confirm resolver default
          </button>
        </Notice>
      )}
      <OperationStatus operation={operation} />
      {duplicate && <CreateConfiguration resolver={resolver.data} source={data} />}
      <div className='flex flex-col gap-6 md:flex-row'>
        <nav aria-label='Configuration sections' className='flex gap-2 md:w-28 md:shrink-0 md:flex-col'>
          <Link className={`${buttonClass} ${tab === 'records' ? 'text-primary' : ''}`} href={path}>
            Records
          </Link>
          <Link className={`${buttonClass} ${tab === 'names' ? 'text-primary' : ''}`} href={`${path}/names`}>
            Names
          </Link>
        </nav>
        <div className='min-w-0 flex-1'>
          {tab === 'records' ? (
            <ConfigurationEditor configuration={data} resolver={resolver.data} />
          ) : (
            <ConfigurationNames configuration={data} resolver={resolver.data} />
          )}
        </div>
      </div>
    </div>
  )
}
