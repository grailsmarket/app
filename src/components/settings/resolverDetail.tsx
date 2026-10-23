'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { ShortArrow, useWindowSize } from 'ethereum-identity-kit'
import type { Address } from 'viem'
import { useResolverCatalog, useResolverDirectory } from '@/hooks/settings/useResolverDirectory'
import { cn } from '@/utils/tailwind'
import { QueryError, ResolverAddress, SettingsNotice, resolverPath } from './shared'
import { ConfigurationTable } from './configurationList'
import ConfigurationNames from './configurationNames'
import ResolverPermissions from './resolverPermissions'
import PreferredResolverButton from './preferredResolverButton'
import ResolverTitle from './resolverTitle'
import { resolverLabel } from '@/utils/settings/labels'

interface ResolverDetailProps {
  resolver: Address
  tab?: string
}

const ResolverDetail: React.FC<ResolverDetailProps> = ({ resolver, tab = 'configurations' }) => {
  const { width: windowWidth } = useWindowSize()
  const isMobile = (windowWidth ?? 0) < 1024

  const directory = useResolverDirectory()
  const { state } = useResolverCatalog(resolver)
  const preferences = directory.preferences
  const label = resolverLabel(preferences.data, resolver)
  const preferred = directory.preferred?.address.toLowerCase() === resolver.toLowerCase()
  const canReadLabel =
    preferred || !!preferences.data?.resolvers.some((item) => item.address.toLowerCase() === resolver.toLowerCase())

  useEffect(() => {
    if (state.data) directory.remember(resolver)
  }, [resolver, !!state.data])

  return (
    <div className='flex flex-col gap-4 md:gap-6'>
      <Link
        href='/settings/resolvers'
        className='text-neutral hover:text-primary flex w-fit items-center gap-2 text-lg'
      >
        <ShortArrow className='h-3.5 w-3.5 -rotate-90' /> Resolvers
      </Link>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div className='flex flex-col gap-1'>
          <ResolverTitle
            key={`${preferences.account}:${resolver}`}
            resolver={resolver}
            label={label}
            available={preferences.isSuccess && canReadLabel}
            preferred={preferred}
          />
          <ResolverAddress address={resolver} truncate={isMobile} showLabel={false} />
        </div>
        <div className='flex flex-wrap items-center gap-3'>
          <PreferredResolverButton resolver={resolver} />
        </div>
      </div>
      {preferred && !directory.preferred?.hasRoles && (
        <SettingsNotice>
          This is your preferred resolver for registrations, but you no longer have access to manage its records.
        </SettingsNotice>
      )}
      {preferences.isError && <QueryError error={preferences.error} retry={() => preferences.refetch()} />}
      <div className='flex flex-col gap-4'>
        <nav aria-label='Resolver sections' className='border-tertiary flex gap-2 overflow-x-auto border-b'>
          {['configurations', 'names', 'permissions'].map((item) => (
            <Link
              key={item}
              href={`${resolverPath(resolver)}${item === 'configurations' ? '' : `/${item}`}`}
              aria-current={tab === item ? 'page' : undefined}
              className={cn(
                'border-b-2 px-3 pb-2 text-lg font-semibold capitalize',
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

export default ResolverDetail
