'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useConfigurations, useUserResolvers } from '@/hooks/ens-v2/useResolverData'
import type { ResolverSummary } from '@/types/ens-v2'
import { configurationPath } from '@/types/ens-v2'
import { AddressLabel, buttonClass, Notice } from './ui'
import CreateConfiguration from './createConfiguration'

export function ResolverConfigurations({ resolver }: { resolver: ResolverSummary }) {
  const configurations = useConfigurations(resolver.address)
  const [creating, setCreating] = useState(false)
  return (
    <div className='flex flex-col gap-4'>
      {resolver.supported && (
        <button className={`${buttonClass} self-start`} onClick={() => setCreating(!creating)}>
          {creating ? 'Close new configuration' : 'New configuration'}
        </button>
      )}
      {creating && <CreateConfiguration resolver={resolver} />}
      {configurations.isPending && <Notice>Loading configurations…</Notice>}
      {configurations.error && <Notice error>{configurations.error.message}</Notice>}
      <div className='flex flex-col'>
        {configurations.data?.pages
          .flatMap((page) => page.items)
          .map((configuration) => (
            <Link
              key={configuration.recordId}
              href={configurationPath(resolver.chainId, resolver.address, configuration.recordId)}
              className='group border-tertiary hover:bg-secondary grid grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-4 border-b py-4 text-sm md:grid-cols-[minmax(0,1fr)_100px_100px_70px_20px]'
            >
              <span className='truncate font-medium'>
                {configuration.label ||
                  (configuration.isDefault ? 'Default Configuration' : `Configuration ${configuration.recordId}`)}
                {configuration.isDefault && <span className='text-primary ml-2 text-xs'>Default</span>}
              </span>
              <span className='text-neutral'>{configuration.recordCount} records</span>
              <span className='text-neutral'>{configuration.nameCount} names</span>
              <span className='text-neutral'>#{configuration.recordId}</span>
              <span
                aria-hidden
                className='hidden opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 md:block'
              >
                →
              </span>
            </Link>
          ))}
      </div>
      {configurations.data?.pages[0]?.items.length === 0 && (
        <Notice>No configurations yet. Create one without attaching a domain.</Notice>
      )}
      {configurations.hasNextPage && (
        <button
          className={buttonClass}
          disabled={configurations.isFetchingNextPage}
          onClick={() => configurations.fetchNextPage()}
        >
          Load more configurations
        </button>
      )}
    </div>
  )
}

export default function ConfigurationList() {
  const list = useUserResolvers()
  return (
    <div className='flex flex-col gap-5'>
      <h2 className='text-2xl font-semibold'>Records</h2>
      <p className='text-neutral'>
        Configurations grouped by resolver. Editing a shared configuration affects every name using it.
      </p>
      {list.isPending && <Notice>Loading resolvers…</Notice>}
      {list.error && <Notice error>{list.error.message}</Notice>}
      {list.data?.pages
        .flatMap((page) => page.items)
        .map((resolver) => (
          <details key={resolver.address} className='border-tertiary rounded-lg border p-4'>
            <summary className='flex cursor-pointer flex-wrap items-center gap-3'>
              <span className='font-semibold'>{resolver.label || 'Resolver'}</span>
              <span className='text-neutral'>
                (<AddressLabel address={resolver.address} />)
              </span>
            </summary>
            <div className='mt-5'>
              <ResolverConfigurations resolver={resolver} />
            </div>
          </details>
        ))}
      {list.data?.pages[0]?.items.length === 0 && (
        <Notice>
          No resolvers found.{' '}
          <Link className='underline' href='/settings/resolvers'>
            Deploy a resolver
          </Link>{' '}
          to start creating configurations.
        </Notice>
      )}
      {list.hasNextPage && (
        <button className={buttonClass} disabled={list.isFetchingNextPage} onClick={() => list.fetchNextPage()}>
          Load more resolvers
        </button>
      )}
    </div>
  )
}
