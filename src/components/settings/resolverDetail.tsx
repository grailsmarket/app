'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { ShortArrow, useWindowSize } from 'ethereum-identity-kit'
import type { Address } from 'viem'
import { useResolverCatalog, useResolverDirectory } from '@/hooks/settings/useResolverDirectory'
import { cn } from '@/utils/tailwind'
import { ResolverAddress, resolverPath } from './shared'
import { ResolverAccess } from './resolverList'
import { ConfigurationTable } from './configurationList'
import ConfigurationNames from './configurationNames'
import ResolverPermissions from './resolverPermissions'

export default function ResolverDetail({ resolver, tab = 'configurations' }: { resolver: Address; tab?: string }) {
  const { width: windowWidth } = useWindowSize()
  const isMobile = (windowWidth ?? 0) < 786

  const directory = useResolverDirectory()
  const { state } = useResolverCatalog(resolver)

  useEffect(() => {
    if (state.data) directory.remember(resolver)
  }, [resolver, !!state.data])

  return (
    <div className='flex flex-col gap-6'>
      <Link
        href='/settings/resolvers'
        className='text-neutral hover:text-primary flex w-fit items-center gap-2 text-lg'
      >
        <ShortArrow className='h-3.5 w-3.5 -rotate-90' /> Resolvers
      </Link>
      <div className='flex items-center justify-between'>
        <div className='flex flex-col gap-1'>
          <h2 className='text-2xl font-semibold'>Resolver</h2>
          <ResolverAddress address={resolver} truncate={isMobile} />
        </div>
        <div className='bg-secondary rounded-sm px-3 py-1.5 text-lg'>
          <ResolverAccess resolver={resolver} />
        </div>
      </div>
      <div className='flex flex-col gap-4'>
        <nav aria-label='Resolver sections' className='border-tertiary flex gap-5 overflow-x-auto border-b'>
          {['configurations', 'names', 'permissions'].map((item) => (
            <Link
              key={item}
              href={`${resolverPath(resolver)}${item === 'configurations' ? '' : `/${item}`}`}
              aria-current={tab === item ? 'page' : undefined}
              className={cn(
                'border-b-2 px-1 pb-3 text-lg font-semibold capitalize',
                tab === item ? 'border-primary text-primary' : 'text-neutral hover:text-foreground border-transparent'
              )}
            >
              {item}
            </Link>
          ))}
        </nav>
        {tab === 'permissions' ? (
          <ResolverPermissions resolver={resolver} />
        ) : tab === 'names' ? (
          <ConfigurationNames resolver={resolver} />
        ) : (
          <ConfigurationTable resolver={resolver} />
        )}
      </div>
    </div>
  )
}
