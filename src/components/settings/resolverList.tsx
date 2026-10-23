'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ShortArrow, useWindowSize } from 'ethereum-identity-kit'
import { type Address, encodeFunctionData, isAddress, parseEventLogs, zeroAddress } from 'viem'
import Input from '@/components/ui/input'
import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'
import { useResolverCatalog, useResolverDirectory } from '@/hooks/settings/useResolverDirectory'
import type { SettingsResolver } from '@/types/ens'
import { useConfigurationNames } from '@/hooks/settings/useConfigurationNames'
import { useResolverData } from '@/hooks/settings/useResolverData'
import { resolverNameCount } from '@/utils/settings/resolverData'
import { useSettingsTransaction } from '@/hooks/settings/useSettingsTransaction'
import { usePermissionedResolver } from '@/hooks/resolver/usePermissionedResolver'
import { roleErrorText, useRoleSection } from '@/hooks/records/useV2Roles'
import { RESOLVER_ROLE_DEFINITIONS, adminRole, hasRole } from '@/utils/records/v2Roles'
import { newResolverVersion } from '@/utils/records/resolverDeployment'
import { loadResolverState } from '@/utils/records/loadResolver'
import { createV2RecordsClient } from '@/utils/records/client'
import { VERIFIABLE_FACTORY_ABI as abi } from '@/constants/web3/abi/VerifiableFactory'
import { activeChain } from '@/constants/web3/chain'
import { formatTimeAgo } from '@/utils/time/formatTimeAgo'
import { config } from '@/lib/config'
import { useSettingsDirty } from './navigationGuard'
import {
  QueryError,
  SettingsNotice,
  resolverPath,
  tableClass,
  thClass,
  tdClass,
  ResolverAddress,
  trClass,
} from './shared'
import { cn } from '@/utils/tailwind'

interface ResolverAccessProps {
  resolver: Address
  access?: SettingsResolver
}

export const ResolverAccess: React.FC<ResolverAccessProps> = ({ resolver, access }) => {
  const { address } = useAccount()
  const section = useRoleSection('resolver', resolver)

  if (section.snapshot.isLoading) return <span className='text-neutral'>Loading…</span>

  if (!section.snapshot.data) return <span className='text-neutral'>Unavailable</span>

  const root = section.snapshot.data.viewerRootRoles
  const all = RESOLVER_ROLE_DEFINITIONS.reduce((bits, role) => bits | role.bit | adminRole(role.bit), BigInt(0))
  const setters = RESOLVER_ROLE_DEFINITIONS.filter(
    (role) => role.field || ['contenthash', 'name'].includes(role.id)
  ).reduce((bits, role) => bits | role.bit, BigInt(0))
  const scoped =
    section.assignments.some(
      (item) => item.account.toLowerCase() === address?.toLowerCase() && item.bitmap !== BigInt(0)
    ) ||
    (!section.history.data && !!access?.keyGrants?.length)

  return (
    <span>
      {hasRole(root, all)
        ? 'Full control'
        : hasRole(root, setters)
          ? 'Record editor'
          : root || scoped
            ? 'Limited access'
            : section.history.isLoading
              ? 'Checking access…'
              : section.history.isError
                ? 'Access incomplete'
                : 'Read only'}
    </span>
  )
}

interface ResolverRowProps {
  resolver: SettingsResolver
  index: number
  list: any[]
}

const ResolverRow: React.FC<ResolverRowProps> = ({ resolver, index, list }) => {
  const { width } = useWindowSize()
  const { catalog, client } = useResolverCatalog(resolver.address)
  const resolverData = useResolverData(resolver.address)
  const nameCount = resolverNameCount(resolverData.details.data, resolverData.configurations.data)
  const createdAt = resolverData.details.data?.created_at ?? resolver.createdAt
  const changedAt = resolverData.details.data ? resolverData.details.data.updated_at : resolver.updatedAt
  const changedBlock = resolverData.details.data?.updated_block ?? resolver.updatedBlock
  const changedAtBlock = changedBlock === undefined ? undefined : BigInt(changedBlock)
  const latestBlock =
    catalog?.lastActivityBlock !== undefined &&
    (changedAtBlock === undefined || catalog.lastActivityBlock > changedAtBlock)
      ? catalog.lastActivityBlock
      : changedAtBlock
  const timestamp = changedAt && latestBlock === changedAtBlock ? Date.parse(changedAt) : undefined
  const changedAtTimestamp = timestamp !== undefined && Number.isFinite(timestamp) ? timestamp : undefined

  const activity = useQuery({
    queryKey: ['settings', 'block-time', activeChain.id, latestBlock?.toString()],
    queryFn: async () => Number((await client.getBlock({ blockNumber: latestBlock! })).timestamp) * 1000,
    enabled: changedAtTimestamp === undefined && latestBlock !== undefined,
    staleTime: Infinity,
    retry: false,
  })

  const updatedAt = changedAtTimestamp ?? activity.data
  const { names } = useConfigurationNames(
    resolver.address,
    resolverData.details.isError || resolverData.configurations.isError
  )

  return (
    <tr
      className={cn(
        trClass(index, list),
        'hover:bg-secondary focus-within:bg-secondary group/resolver relative transition-colors'
      )}
    >
      <td
        className={cn(tdClass, 'text-foreground!')}
        title={createdAt ? `Created ${new Date(createdAt).toLocaleString()}` : undefined}
      >
        <Link
          href={resolverPath(resolver.address)}
          aria-label={`Open resolver ${resolver.name || resolver.address}`}
          className='focus-visible:outline-primary absolute inset-0 focus-visible:outline-2 focus-visible:-outline-offset-2'
        />
        {resolver.name && <p className='mb-1 font-semibold'>{resolver.name}</p>}
        <ResolverAddress
          address={resolver.address}
          truncate={(width || 0) < 1024}
          canCopy={false}
          etherscan={false}
          textColor='text-foreground!'
        />
      </td>
      <td className={tdClass}>
        <ResolverAccess resolver={resolver.address} access={resolver} />
      </td>
      <td className={tdClass}>{catalog?.recordCount.toString() ?? resolverData.details.data?.record_count ?? '—'}</td>
      <td
        className={tdClass}
        title={
          nameCount === undefined
            ? 'Known names from resolver links, checked against their current resolver. Inherited and never-linked names may not be discovered.'
            : 'Names assigned to this resolver, including names using its default configuration. Subnames inheriting an ancestor’s resolver may not be included.'
        }
      >
        {nameCount ?? names.data?.names.length ?? '—'}
      </td>
      <td className={`${tdClass} text-neutral`} title={updatedAt ? new Date(updatedAt).toLocaleString() : undefined}>
        {updatedAt ? formatTimeAgo(updatedAt) : '—'}
      </td>
      <td className='px-2 opacity-0 transition-opacity group-hover/resolver:opacity-100'>
        <ShortArrow className='h-3.5 w-3.5 rotate-90' />
      </td>
    </tr>
  )
}

export const ResolverLookup = () => {
  const router = useRouter()
  const queries = useQueryClient()
  const { address } = useAccount()
  const directory = useResolverDirectory()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()

  const open = async () => {
    setLoading(true)
    setError(undefined)

    try {
      if (!isAddress(input, { strict: false }) || input.toLowerCase() === zeroAddress)
        throw new Error('Enter a valid resolver address.')

      await loadResolverState(queries, createV2RecordsClient(), input, 'grails-settings.invalid', address)
      directory.remember(input)
      router.push(resolverPath(input))
    } catch (error) {
      setError(roleErrorText(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex flex-row gap-2 sm:items-center md:gap-3'>
        <Input
          label='Resolver'
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder='Address'
        />
        <SecondaryButton className='h-12!' disabled={loading || !input.trim()} onClick={open}>
          {loading ? 'Checking…' : 'Open'}
        </SecondaryButton>
      </div>
      {error && <SettingsNotice error>{error}</SettingsNotice>}
    </div>
  )
}

const ResolverList = () => {
  const directory = useResolverDirectory()
  const transaction = useSettingsTransaction()
  const { getResolverData } = usePermissionedResolver()
  const [deployed, setDeployed] = useState<Address>()

  useSettingsDirty(false, transaction.busy || transaction.submitted)

  const deploy = () => {
    const version = directory.predicted.data === false ? 0 : newResolverVersion()

    void transaction.run([
      {
        label: 'Deploy resolver',
        prepare: async () => {
          const { resolverSalt, resolverInitData } = getResolverData(BigInt(version))

          return {
            to: config.ensV2VerifiableFactory,
            data: encodeFunctionData({
              abi,
              functionName: 'deployProxy',
              args: [config.ensV2PermissionedResolverImpl, resolverSalt, resolverInitData],
            }),
          }
        },
        confirmed: (receipt) => {
          const log = parseEventLogs({
            abi,
            eventName: 'ProxyDeployed',
            logs: receipt.logs.filter(
              (log) => log.address.toLowerCase() === config.ensV2VerifiableFactory.toLowerCase()
            ),
          })[0]
          if (!log) throw new Error('Deployment confirmed. Refresh the resolver list to locate its address.')
          directory.remember(log.args.proxyAddress, true)
          setDeployed(log.args.proxyAddress)
        },
      },
    ])
  }

  return (
    <div className='flex flex-col gap-4 md:gap-6'>
      <div className='flex items-center justify-between'>
        <h2 className='text-2xl font-semibold'>Resolvers</h2>
        <PrimaryButton
          onClick={deploy}
          disabled={transaction.busy || transaction.pending || directory.predicted.isLoading}
        >
          Deploy resolver
        </PrimaryButton>
      </div>
      {deployed && (
        <Link className='text-primary flex w-fit items-center gap-2 text-lg underline' href={resolverPath(deployed)}>
          Open deployed resolver <ShortArrow className='h-3.5 w-3.5 rotate-90' />
        </Link>
      )}
      <ResolverLookup />
      {/* <p className='text-neutral text-lg'>
        Deployed resolvers and delegated access are discovered onchain. You can also open a resolver by address.
        Personal labels and saved registration defaults are not available yet.
      </p> */}
      {directory.owned.isError && <QueryError error={directory.owned.error} retry={() => directory.owned.refetch()} />}
      {directory.delegated.isLoading && <p className='text-neutral text-lg'>Checking shared resolvers…</p>}
      {directory.delegated.isError && (
        <SettingsNotice>
          Some shared resolvers could not be discovered. Open them by address, or{' '}
          <button className='text-primary cursor-pointer underline' onClick={() => directory.delegated.refetch()}>
            retry discovery
          </button>
          .
        </SettingsNotice>
      )}
      {directory.loading ? (
        <SettingsNotice>Finding your resolvers…</SettingsNotice>
      ) : directory.resolvers.length ? (
        <div className='overflow-x-auto'>
          <table className={tableClass}>
            <thead>
              <tr className='border-tertiary border-b'>
                {['Resolver', 'Your access', 'Configs.', 'Names', 'Updated'].map((label) => (
                  <th key={label} className={thClass}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {directory.resolvers.map((resolver, index) => (
                <ResolverRow key={resolver.address} resolver={resolver} index={index} list={directory.resolvers} />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <SettingsNotice>No resolvers found. Deploy one or open an existing resolver above.</SettingsNotice>
      )}
    </div>
  )
}

export default ResolverList
