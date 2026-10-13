'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAccount } from 'wagmi'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useUserResolvers, useResolverPreferences } from '@/hooks/ens-v2/useResolverData'
import { useResolverOperation } from '@/hooks/ens-v2/useResolverOperation'
import { accessLabel } from '@/utils/web3/resolver-permissions'
import { ownedResolverSalt } from '@/utils/web3/ensv2'
import { deployResolver } from '@/utils/web3/resolver-transactions'
import { ensApi } from '@/api/ens-v2'
import { activeChain } from '@/constants/web3/chain'
import type { Address } from 'viem'
import { AddressLabel, buttonClass, Notice, OperationStatus } from './ui'

export default function ResolverList() {
  const { address } = useAccount()
  const list = useUserResolvers()
  const preference = useResolverPreferences()
  const cache = useQueryClient()
  const operation = useResolverOperation()
  const [review, setReview] = useState(false)
  const [usePredicted, setUsePredicted] = useState(false)
  const [salt, setSalt] = useState(() => BigInt(`0x${crypto.randomUUID().replaceAll('-', '')}`))
  const savePreference = useMutation({
    mutationFn: (resolver: Address | null) => ensApi.setPreference(activeChain.id, resolver),
    onSuccess: () => cache.invalidateQueries({ queryKey: ['ens-v2'] }),
  })
  const deploy = () =>
    operation.mutate(async ({ client, wallet, v2, onHash }) =>
      deployResolver(client, wallet, v2, usePredicted ? ownedResolverSalt(wallet.account!.address) : salt, onHash)
    )
  return (
    <div className='flex flex-col gap-5'>
      <div className='flex items-center justify-between gap-3'>
        <h2 className='text-2xl font-semibold'>Resolvers</h2>
        <button
          className={buttonClass}
          disabled={operation.isPending}
          onClick={() => {
            if (!review) {
              operation.reset()
              setSalt(BigInt(`0x${crypto.randomUUID().replaceAll('-', '')}`))
            }
            setReview(!review)
          }}
        >
          Deploy resolver
        </button>
      </div>
      <p className='text-neutral'>Manage the resolvers you deployed and those where you have delegated access.</p>
      {review && (
        <div className='border-tertiary flex flex-col gap-3 rounded-md border p-4'>
          <p>
            Deploy a new resolver with full control assigned to your connected wallet. Existing names and your
            registration preference will stay as they are.
          </p>
          <label className='flex gap-2 text-sm'>
            <input
              type='checkbox'
              checked={usePredicted}
              disabled={operation.isPending || operation.isSuccess}
              onChange={(event) => setUsePredicted(event.target.checked)}
            />
            Deploy my predicted registration resolver
          </label>
          <button
            className={`${buttonClass} self-start`}
            disabled={operation.isPending || operation.isSuccess}
            onClick={deploy}
          >
            Confirm deployment
          </button>
          <OperationStatus operation={operation} />
          {operation.data?.resolver && (
            <Link
              className='text-primary underline'
              href={`/settings/resolvers/${activeChain.id}/${operation.data.resolver}`}
            >
              Open deployed resolver
            </Link>
          )}
        </div>
      )}
      {list.isPending && <Notice>Loading resolvers…</Notice>}
      {list.error && (
        <Notice error>
          {list.error.message}{' '}
          <button className='underline' onClick={() => list.refetch()}>
            Retry
          </button>
        </Notice>
      )}
      {list.data && (
        <div className='border-tertiary overflow-x-auto rounded-lg border'>
          <table className='w-full text-left text-sm'>
            <thead className='bg-secondary text-neutral'>
              <tr>
                {['Resolver', 'Your access', 'Configurations', 'Names', 'Last activity', 'Registration'].map(
                  (column) => (
                    <th className='p-3 font-normal' key={column}>
                      {column}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {list.data.pages
                .flatMap((page) => page.items)
                .map((resolver) => (
                  <tr key={resolver.address} className='border-tertiary border-t'>
                    <td className='p-3'>
                      <Link
                        className='mb-1 block font-medium hover:underline'
                        href={`/settings/resolvers/${activeChain.id}/${resolver.address}`}
                      >
                        {resolver.label || 'Unnamed resolver'}
                      </Link>
                      <AddressLabel address={resolver.address} />
                      {resolver.deployer?.toLowerCase() !== address?.toLowerCase() && (
                        <span className='text-neutral mt-1 block text-xs'>External resolver</span>
                      )}
                    </td>
                    <td className='p-3'>{accessLabel(resolver.grants, address)}</td>
                    <td className='p-3'>
                      <Link
                        className='hover:underline'
                        href={`/settings/resolvers/${activeChain.id}/${resolver.address}`}
                      >
                        {resolver.configurationCount}
                      </Link>
                    </td>
                    <td
                      className='p-3'
                      title='Known active names. Internal anchors and old links are excluded. Inherited resolver usage may extend beyond this count.'
                    >
                      <Link
                        className='hover:underline'
                        href={`/settings/resolvers/${activeChain.id}/${resolver.address}?tab=names`}
                      >
                        {resolver.nameCount}
                      </Link>
                      <span className='text-neutral block text-xs'>{resolver.ownedNameCount} yours</span>
                    </td>
                    <td className='p-3'>
                      {resolver.lastActivity ? new Date(resolver.lastActivity).toLocaleDateString() : '—'}
                    </td>
                    <td className='p-3'>
                      <button
                        className={buttonClass}
                        disabled={savePreference.isPending}
                        onClick={() =>
                          savePreference.mutate(
                            preference.data?.preferredResolver?.toLowerCase() === resolver.address.toLowerCase()
                              ? null
                              : resolver.address
                          )
                        }
                      >
                        {preference.data?.preferredResolver?.toLowerCase() === resolver.address.toLowerCase()
                          ? 'Default · reset'
                          : 'Use as default'}
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {list.data.pages[0]?.items.length === 0 && (
            <p className='text-neutral p-6'>No resolvers found for this wallet.</p>
          )}
        </div>
      )}
      {list.hasNextPage && (
        <button className={buttonClass} onClick={() => list.fetchNextPage()} disabled={list.isFetchingNextPage}>
          Load more
        </button>
      )}
      {preference.error && <Notice error>{preference.error.message}</Notice>}
      {savePreference.error && <Notice error>{savePreference.error.message}</Notice>}
    </div>
  )
}
