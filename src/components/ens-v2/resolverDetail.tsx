'use client'

import type { Address } from 'viem'
import { useResolver } from '@/hooks/ens-v2/useResolverData'
import { useState } from 'react'
import { AddressLabel, buttonClass, Notice, PersonalLabel } from './ui'
import { ResolverConfigurations } from './configurationList'
import ResolverRoles from './resolverRoles'
import ResolverNames from './resolverNames'

export default function ResolverDetail({
  resolver,
  initialTab = 'configurations',
}: {
  resolver: Address
  initialTab?: 'configurations' | 'access' | 'names'
}) {
  const query = useResolver(resolver)
  const [tab, setTab] = useState<'configurations' | 'access' | 'names'>(initialTab)
  if (query.isPending) return <Notice>Loading resolver…</Notice>
  if (query.error) return <Notice error>{query.error.message}</Notice>
  const data = query.data
  return (
    <div className='flex flex-col gap-6'>
      <div>
        <h2 className='mb-2 text-2xl font-semibold'>{data.label || 'Resolver'}</h2>
        <AddressLabel address={resolver} />
      </div>
      <PersonalLabel key={`${resolver}:${data.label}`} resolver={resolver} initial={data.label} />
      {!data.supported && <Notice>This resolver implementation is not supported for configuration writes.</Notice>}
      <nav aria-label='Resolver detail' className='flex gap-2'>
        {(['configurations', 'access', 'names'] as const).map((value) => (
          <button
            className={`${buttonClass} ${value === tab ? 'text-primary' : ''}`}
            aria-pressed={value === tab}
            key={value}
            onClick={() => setTab(value)}
          >
            {value === 'access' ? 'Access' : value === 'names' ? 'Names' : 'Configurations'}
          </button>
        ))}
      </nav>
      {tab === 'configurations' ? (
        <ResolverConfigurations resolver={data} />
      ) : tab === 'names' ? (
        <ResolverNames resolver={resolver} />
      ) : (
        data.supported && <ResolverRoles resolver={data} />
      )}
    </div>
  )
}
