'use client'

import { ConfigurationTableSkeleton, ConfigurationGroupsSkeleton } from '@/components/ui/ensSkeletons'
import { SkeletonText } from '@/components/ui/loadingSkeleton'

import React, { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useAccount } from 'wagmi'
import { type Address } from 'viem'
import { ShortArrow } from 'ethereum-identity-kit'
import SecondaryButton from '@/components/ui/buttons/secondary'
import { useResolverCatalog, useResolverDirectory } from '@/hooks/settings/useResolverDirectory'
import { useConfigurationNames } from '@/hooks/settings/useConfigurationNames'
import { useResolverData } from '@/hooks/settings/useResolverData'
import { configurationNameCount, configurationRecordCount } from '@/utils/settings/resolverData'
import { readConfiguration } from '@/utils/records/v2Resolver'
import { activeChain } from '@/constants/web3/chain'
import {
  QueryError,
  ResolverAddress,
  SettingsNotice,
  configurationPath,
  tableClass,
  tdClass,
  thClass,
  primaryLinkClass,
} from './shared'
import { ResolverLookup } from './resolverList'
import { cn } from '@/utils/tailwind'
import Label from '../ui/label'
import { useRouter } from 'next/navigation'
import { configurationName } from '@/utils/settings/labels'
import { PlusIcon } from '../ui/modal/icons'

interface ConfigurationRowProps {
  resolver: Address
  id: bigint
}

const ConfigurationRow: React.FC<ConfigurationRowProps> = ({ resolver, id }) => {
  const { address } = useAccount()
  const router = useRouter()
  const { client, catalog } = useResolverCatalog(resolver)
  const resolverData = useResolverData(resolver)
  const nameCount = configurationNameCount(id, resolverData.details.data, resolverData.configurations.data)
  const { names } = useConfigurationNames(resolver, resolverData.details.isError || resolverData.configurations.isError)
  const effectiveId = id === BigInt(0) ? catalog?.defaultRecordId : id
  const configuration = catalog?.configurations?.find((record) => record.record_id === effectiveId?.toString())
  const recordCount = configuration
    ? configurationRecordCount(configuration)
    : effectiveId === BigInt(0)
      ? 0
      : undefined

  const records = useQuery({
    queryKey: [
      'settings',
      'configuration',
      activeChain.id,
      resolver,
      id.toString(),
      address,
      catalog?.blockNumber.toString(),
      catalog?.historyComplete,
    ],
    enabled: !!catalog && !catalog.permissions,
    retry: false,
    staleTime: 30_000,
    queryFn: () =>
      readConfiguration({
        client,
        resolver,
        catalog: catalog!,
        name: 'grails-settings.invalid',
        selectedId: id,
        account: address,
      }),
  })

  const defaultEntry = id === BigInt(0)
  const actualId = defaultEntry ? catalog?.defaultRecordId : id
  const knownNames = names.data?.names.filter((name) =>
    defaultEntry ? name.recordId === BigInt(0) : name.effectiveId === id
  )
  const label = configurationName(resolverData.preferences.data, id)

  return (
    <tr
      className={cn('group hover:bg-secondary border-tertiary border-b transition-colors')}
      onClick={() => router.push(configurationPath(resolver, id))}
    >
      <td className={cn(tdClass, 'flew-wrap flex gap-2')}>
        <p className='font-medium text-nowrap'>{label}</p>
        {!defaultEntry && id === catalog?.defaultRecordId && (
          <Label label='Default' className='bg-tertiary text-foreground text-sm font-medium' />
        )}
      </td>
      <td
        className={tdClass}
        title={catalog?.historyComplete ? undefined : 'Additional keys are still being discovered.'}
      >
        {recordCount !== undefined ? (
          recordCount
        ) : records.data ? (
          `${records.data.filter((row) => row.value !== '').length}${catalog?.historyComplete ? '' : '+'}`
        ) : records.isLoading || resolverData.configurations.isLoading ? (
          <SkeletonText label='Loading record count…' className='w-8' />
        ) : (
          '—'
        )}
      </td>
      <td className={tdClass}>
        <Link
          href={`${configurationPath(resolver, id)}/names`}
          title={
            nameCount === undefined
              ? 'Known current names; inherited and never-linked names may be absent.'
              : defaultEntry
                ? 'Names using the resolver default.'
                : 'Explicit links and names inheriting this configuration.'
          }
        >
          {nameCount ??
            knownNames?.length ??
            (names.isLoading || resolverData.configurations.isLoading || resolverData.details.isLoading ? (
              <SkeletonText label='Loading name count…' className='w-8' />
            ) : (
              '—'
            ))}
        </Link>
      </td>
      <td className={`${tdClass} text-neutral`}>{actualId === BigInt(0) ? '-' : (actualId?.toString() ?? '—')}</td>
      <td className={tdClass}>
        <Link
          aria-label={`Open ${label}`}
          href={configurationPath(resolver, id)}
          className='text-neutral hover:text-primary hidden md:block md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100'
        >
          <ShortArrow className='h-3.5 w-3.5 rotate-90' />
        </Link>
      </td>
    </tr>
  )
}

export const ConfigurationTable = ({ resolver }: { resolver: Address }) => {
  const { catalog, state, history } = useResolverCatalog(resolver)
  const [page, setPage] = useState(BigInt(0))

  if (state.isError) return <QueryError error={state.error} retry={() => state.refetch()} />
  if (!catalog) return <ConfigurationTableSkeleton />

  const start = page * BigInt(10) + BigInt(1)
  const ids: bigint[] = []
  for (let id = start; id <= catalog.recordCount && id < start + BigInt(10); id++) ids.push(id)

  return (
    <div>
      {history.isError && (
        <SettingsNotice>
          Additional record discovery is unavailable. Known configurations remain accessible.{' '}
          <button className='text-primary cursor-pointer underline' onClick={() => history.refetch()}>
            Retry discovery
          </button>
        </SettingsNotice>
      )}
      <div className='overflow-x-auto'>
        <table className={tableClass}>
          <thead>
            <tr className='border-tertiary border-b'>
              {['Configuration', 'Records', 'Names', 'ID'].map((label) => (
                <th key={label} className={thClass}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {page === BigInt(0) && <ConfigurationRow resolver={resolver} id={BigInt(0)} />}
            {ids.map((id) => (
              <ConfigurationRow key={id.toString()} resolver={resolver} id={id} />
            ))}
          </tbody>
        </table>
      </div>
      <div className='flex justify-between p-4'>
        {(page > BigInt(0) || catalog.recordCount >= start + BigInt(10)) && (
          <div className='flex items-center justify-end gap-3'>
            <SecondaryButton disabled={page === BigInt(0)} onClick={() => setPage(page - BigInt(1))}>
              Previous
            </SecondaryButton>
            <span className='text-neutral'>Page {(page + BigInt(1)).toString()}</span>
            <SecondaryButton
              disabled={catalog.recordCount < start + BigInt(10)}
              onClick={() => setPage(page + BigInt(1))}
            >
              Next
            </SecondaryButton>
          </div>
        )}
        <Link
          href={configurationPath(resolver, 'new')}
          className={cn(primaryLinkClass, 'flex items-center gap-0.5 px-3!')}
        >
          New <PlusIcon className='h-5 w-5 pt-px' strokeWidth={3} />
        </Link>
      </div>
    </div>
  )
}

const ResolverConfigurations = ({ resolver }: { resolver: Address }) => {
  const [open, setOpen] = useState(true)

  return (
    <section className='border-tertiary rounded-md border'>
      <div
        className={cn(
          'bg-secondary flex cursor-pointer items-center justify-between gap-3 rounded-t-md px-4 py-3',
          open && 'mb-3'
        )}
        onClick={() => setOpen(!open)}
      >
        <ResolverAddress address={resolver} truncate={false} textColor='text-foreground!' />
        <ShortArrow className={`h-3.5 w-3.5 ${open ? '' : 'rotate-180'}`} />
      </div>
      {open && <ConfigurationTable resolver={resolver} />}
    </section>
  )
}

export default function ConfigurationList() {
  const directory = useResolverDirectory()

  return (
    <div className='flex flex-col gap-4 md:gap-5'>
      <div className='flex flex-col gap-1'>
        <h2 className='hidden text-2xl font-semibold md:block'>Records</h2>
        <p className='text-neutral text-lg font-medium'>
          Manage configurations shared by your ENS names. Each configuration belongs to one resolver.
        </p>
      </div>
      <ResolverLookup />
      {directory.owned.isError && <QueryError error={directory.owned.error} retry={() => directory.owned.refetch()} />}
      {!directory.loading && directory.delegated.isLoading && (
        <SkeletonText label='Checking shared resolvers…' className='w-48' />
      )}
      {directory.delegated.isError && (
        <SettingsNotice>
          Shared resolver discovery is incomplete. Open a resolver by address to view its configurations.
        </SettingsNotice>
      )}
      {directory.loading ? (
        <ConfigurationGroupsSkeleton />
      ) : directory.resolvers.length ? (
        <div className='flex flex-col gap-3'>
          {directory.resolvers.map((resolver) => (
            <ResolverConfigurations key={resolver.address} resolver={resolver.address} />
          ))}
        </div>
      ) : (
        <SettingsNotice>
          No resolvers found.{' '}
          <Link className='text-primary underline' href='/settings/resolvers'>
            Deploy a resolver
          </Link>{' '}
          to create your first configuration.
        </SettingsNotice>
      )}
    </div>
  )
}
