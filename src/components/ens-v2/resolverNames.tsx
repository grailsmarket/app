'use client'

import Link from 'next/link'
import { useAccount } from 'wagmi'
import { useInfiniteQuery } from '@tanstack/react-query'
import type { Address } from 'viem'
import { ensApi } from '@/api/ens-v2'
import { resolverKey } from '@/hooks/ens-v2/useResolverData'
import { activeChain } from '@/constants/web3/chain'
import { configurationPath } from '@/types/ens-v2'
import { buttonClass, Notice } from './ui'

export default function ResolverNames({ resolver }: { resolver: Address }) {
  const { address } = useAccount()
  const query = useInfiniteQuery({
    queryKey: [...resolverKey(address), 'resolver-names', resolver],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => ensApi.resolverNames(activeChain.id, resolver, pageParam),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    retry: false,
  })
  return (
    <div className='flex flex-col gap-3'>
      <Notice>
        Known active names only. Internal editing names and links remaining on a previous resolver are excluded. Some
        inherited resolver usage may not be indexed.
      </Notice>
      {query.isPending && <Notice>Loading names…</Notice>}
      {query.error && <Notice error>{query.error.message}</Notice>}
      {query.data?.pages
        .flatMap((page) => page.items)
        .map((item) => (
          <div className='border-tertiary flex flex-wrap justify-between gap-3 border-b py-3' key={item.name}>
            <Link href={`/${item.name}`} className='hover:underline'>
              {item.name}
            </Link>
            <span className='text-neutral text-sm'>
              {item.linkMode === 'default' ? 'Resolver default' : 'Explicit'}
              {item.inheritedResolver ? ' · Inherited' : ''}
            </span>
            {item.recordId && (
              <Link
                className='text-primary text-sm underline'
                href={configurationPath(activeChain.id, resolver, item.recordId)}
              >
                Configuration {item.recordId}
              </Link>
            )}
          </div>
        ))}
      {query.data?.pages[0]?.items.length === 0 && <Notice>No known active names use this resolver.</Notice>}
      {query.hasNextPage && (
        <button className={buttonClass} disabled={query.isFetchingNextPage} onClick={() => query.fetchNextPage()}>
          Load more names
        </button>
      )}
    </div>
  )
}
