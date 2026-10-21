'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useAccount } from 'wagmi'
import { type Address } from 'viem'
import { ShortArrow } from 'ethereum-identity-kit'
import SecondaryButton from '@/components/ui/buttons/secondary'
import { useResolverCatalog, useResolverDirectory } from '@/hooks/settings/useResolverDirectory'
import { useConfigurationNames } from '@/hooks/settings/useConfigurationNames'
import { readConfiguration } from '@/utils/records/v2Resolver'
import { activeChain } from '@/constants/web3/chain'
import {
  QueryError,
  ResolverAddress,
  SettingsHeading,
  SettingsNotice,
  configurationPath,
  tableClass,
  tdClass,
  thClass,
  primaryLinkClass,
  trClass,
} from './shared'
import { ResolverLookup } from './resolverList'
import { cn } from '@/utils/tailwind'
import Label from '../ui/label'
import { useRouter } from 'next/navigation'

interface ConfigurationRowProps {
  resolver: Address
  id: bigint
  index: number
  list: any[]
}

const ConfigurationRow: React.FC<ConfigurationRowProps> = ({ resolver, id, index, list }) => {
  const { address } = useAccount()
  const router = useRouter()
  const { client, catalog } = useResolverCatalog(resolver)
  const { names } = useConfigurationNames(resolver)

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
    enabled: !!catalog,
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
  const label = defaultEntry ? 'Default configuration' : `Configuration ${id}`

  return (
    <tr
      className={cn(trClass(index, list), 'group hover:bg-secondary transition-colors')}
      onClick={() => router.push(configurationPath(resolver, id))}
    >
      <td className={cn(tdClass, 'flex gap-2')}>
        <p className='font-medium'>{label}</p>
        {!defaultEntry && id === catalog?.defaultRecordId && (
          <Label label='Default' className='bg-tertiary text-foreground text-sm font-medium' />
        )}
      </td>
      <td
        className={tdClass}
        title={catalog?.historyComplete ? undefined : 'Additional keys are still being discovered.'}
      >
        {records.data
          ? `${records.data.filter((row) => row.value !== '').length}${catalog?.historyComplete ? '' : '+'}`
          : '—'}
      </td>
      <td className={tdClass}>
        <Link
          href={`${configurationPath(resolver, id)}/names`}
          title='Known current names; inherited and never-linked names may be absent.'
        >
          {knownNames ? knownNames.length : '—'}
        </Link>
      </td>
      <td className={`${tdClass} text-neutral`}>
        {actualId === BigInt(0) ? 'Not created' : (actualId?.toString() ?? '—')}
      </td>
      <td className={tdClass}>
        <Link
          aria-label={`Open ${label}`}
          href={configurationPath(resolver, id)}
          className='text-neutral hover:text-primary md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100'
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
  if (!catalog) return <SettingsNotice>Loading configurations…</SettingsNotice>

  const start = page * BigInt(10) + BigInt(1)
  const ids: bigint[] = []
  for (let id = start; id <= catalog.recordCount && id < start + BigInt(10); id++) ids.push(id)

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <p className='text-neutral text-lg'>{catalog.recordCount.toString()} configurations</p>
        <Link href={configurationPath(resolver, 'new')} className={primaryLinkClass}>
          Add New +
        </Link>
      </div>
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
            <tr>
              {['Configuration', 'Records', 'Names', 'ID', ''].map((label) => (
                <th key={label} className={thClass}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {page === BigInt(0) && <ConfigurationRow resolver={resolver} id={BigInt(0)} index={-1} list={ids} />}
            {ids.map((id, index) => (
              <ConfigurationRow key={id.toString()} resolver={resolver} id={id} index={index} list={ids} />
            ))}
          </tbody>
        </table>
      </div>
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
    </div>
  )
}

const ResolverConfigurations = ({ resolver }: { resolver: Address }) => {
  const [open, setOpen] = useState(true)

  return (
    <section className='border-tertiary rounded-md border'>
      <div
        className='bg-secondary flex cursor-pointer items-center justify-between gap-3 rounded-t-md px-4 py-3'
        onClick={() => setOpen(!open)}
      >
        <ResolverAddress address={resolver} truncate={false} textColor='text-foreground!' />
        <ShortArrow className={`h-3.5 w-3.5 ${open ? '' : 'rotate-180'}`} />
      </div>
      {open && (
        <div className='p-4'>
          <ConfigurationTable resolver={resolver} />
        </div>
      )}
    </section>
  )
}

export default function ConfigurationList() {
  const directory = useResolverDirectory()

  return (
    <div className='flex flex-col gap-6'>
      <SettingsHeading
        title='Records'
        description='Manage configurations shared by your ENS names. Each configuration belongs to one resolver.'
      />
      <ResolverLookup />
      {directory.owned.isError && <QueryError error={directory.owned.error} retry={() => directory.owned.refetch()} />}
      {directory.delegated.isLoading && <p className='text-neutral text-lg'>Checking shared resolvers…</p>}
      {directory.delegated.isError && (
        <SettingsNotice>
          Shared resolver discovery is incomplete. Open a resolver by address to view its configurations.
        </SettingsNotice>
      )}
      {directory.loading ? (
        <SettingsNotice>Finding your configurations…</SettingsNotice>
      ) : directory.resolvers.length ? (
        directory.resolvers.map((resolver) => (
          <ResolverConfigurations key={resolver.address} resolver={resolver.address} />
        ))
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
