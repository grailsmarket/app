'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import Link from 'next/link'
import type { Configuration, RecordValue, ResolverSummary } from '@/types/ens-v2'
import { configurationPath } from '@/types/ens-v2'
import { useResolverOperation } from '@/hooks/ens-v2/useResolverOperation'
import { emptyRecordFor } from '@/utils/web3/resolver-permissions'
import {
  createdRecordId,
  newAnchor,
  prepareConfigurationCreation,
  requireSupportedResolver,
  sendResolverCalls,
} from '@/utils/web3/resolver-transactions'
import RecordEditor from './recordEditor'
import { Notice, OperationStatus } from './ui'

export default function CreateConfiguration({
  resolver,
  source,
  name,
  onCreated,
}: {
  resolver: ResolverSummary
  source?: Configuration
  name?: string
  onCreated?: (id: string, records: RecordValue[]) => void
}) {
  const { address } = useAccount()
  const [anchor] = useState(newAnchor)
  const operation = useResolverOperation()
  const create = async (records: RecordValue[]) => {
    await operation
      .mutateAsync(async ({ client, wallet, account, v2, onHash }) => {
        await requireSupportedResolver(client, v2, resolver.address)
        if (source && !source.recordsComplete)
          throw new Error('The source records are incomplete. A complete copy cannot be created yet.')
        const empty = emptyRecordFor(resolver.grants, account)
        const writes = records.length ? records : empty ? [empty] : []
        const calls = await prepareConfigurationCreation(client, account, resolver.address, anchor, writes, name)
        const receipt = await sendResolverCalls(client, wallet, resolver.address, calls, onHash)
        return {
          receipt,
          anchor,
          resolver: resolver.address,
          recordId: createdRecordId(receipt, resolver.address, anchor),
        }
      })
      .then((result) => {
        if (result.recordId) onCreated?.(result.recordId, records)
      })
  }
  return (
    <div className='flex flex-col gap-4'>
      <h3 className='text-xl font-semibold'>{source ? 'Duplicate configuration' : 'New configuration'}</h3>
      {name && (
        <Notice>This will assign {name} to its new configuration. Other names keep their current configuration.</Notice>
      )}
      {source && !source.recordsComplete ? (
        <Notice error>The indexer has not loaded every source record. Copying is unavailable until it finishes.</Notice>
      ) : (
        !operation.isSuccess && (
          <RecordEditor
            initial={source?.records ?? []}
            grants={resolver.grants}
            account={address}
            onSave={create}
            busy={operation.isPending}
            allowEmpty
            saveLabel='Review new configuration'
          />
        )
      )}
      <OperationStatus operation={operation} />
      {operation.data?.recordId && (
        <Link
          className='text-primary underline'
          href={configurationPath(resolver.chainId, resolver.address, operation.data.recordId)}
        >
          Open Configuration {operation.data.recordId}
        </Link>
      )}
    </div>
  )
}
