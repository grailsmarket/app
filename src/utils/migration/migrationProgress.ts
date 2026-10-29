import { type Address, type PublicClient, isAddress } from 'viem'
import { z } from 'zod'
import { config } from '@/lib/config'
import { MigrationEligibilityError, readMigrationDeployment, readMigrationNames } from './migration'

const INDEXER = 'https://api.bigname.sh'

export class MigrationProgressSyncError extends Error {}

const pageSchema = z.object({
  data: z.array(
    z.object({
      name: z.string(),
      status: z.enum(['active', 'expired', 'released', 'unregistered']),
      owner: z
        .string()
        .refine((value) => isAddress(value, { strict: false }))
        .nullish(),
    })
  ),
  page: z.object({
    next_cursor: z.string().nullable(),
    has_more: z.boolean(),
    total_count: z.number().int().nonnegative().nullable(),
  }),
  meta: z.object({ completeness: z.enum(['full', 'partial', 'unsupported']).optional() }),
})

const readPage = async (owner: Address, params: URLSearchParams, signal?: AbortSignal) => {
  const response = await fetch(`${INDEXER}/v1/addresses/${owner.toLowerCase()}/names?${params}`, {
    cache: 'no-store',
    signal: AbortSignal.any([...(signal ? [signal] : []), AbortSignal.timeout(15_000)]),
  })
  if (!response.ok) throw new Error('Migration progress is unavailable. Please retry.')
  const page = pageSchema.parse(await response.json())
  if (page.meta.completeness && page.meta.completeness !== 'full')
    throw new Error('The ENS indexer returned incomplete migration progress. Please retry.')
  return page
}

export const readMigrationProgress = async (client: PublicClient, owner: Address, signal?: AbortSignal) => {
  if ((await client.getChainId()) !== 1) throw new Error('Migration rewards are available on Ethereum mainnet.')
  const params = new URLSearchParams({
    namespace: 'ens',
    relation: 'owner',
    authority: 'ens_v1,ens_v0',
    dedupe: 'name',
    include: 'total_count',
    sort: 'name',
    order: 'asc',
    page_size: '200',
  })
  const names = new Set<string>()
  const seen = new Set<string>()
  const cursors = new Set<string>()
  let expectedTotal: number | undefined
  while (true) {
    signal?.throwIfAborted()
    const { data, page } = await readPage(owner, params, signal)
    if (page.total_count === null) throw new Error('The ENS indexer could not verify the remaining name count.')
    if (expectedTotal !== undefined && page.total_count !== expectedTotal)
      throw new MigrationProgressSyncError(
        'The ENS name count changed while checking migration progress. Please retry.'
      )
    expectedTotal = page.total_count
    for (const row of data) {
      if (seen.has(row.name)) throw new MigrationProgressSyncError('The ENS name list repeated a name. Please retry.')
      seen.add(row.name)
      if (row.name.endsWith('.reverse') || row.status === 'released' || row.status === 'unregistered') continue
      if (row.owner?.toLowerCase() !== owner.toLowerCase())
        throw new MigrationProgressSyncError('The ENS owner index changed. Please retry.')
      names.add(row.name)
    }
    if (!page.has_more) {
      if (seen.size !== expectedTotal)
        throw new MigrationProgressSyncError('The ENS name list is incomplete. Please retry.')
      break
    }
    if (!data.length || !page.next_cursor || cursors.has(page.next_cursor))
      throw new Error('The ENS name list is incomplete. Please retry.')
    cursors.add(page.next_cursor)
    params.set('cursor', page.next_cursor)
  }
  const migratedPage = await readPage(
    owner,
    new URLSearchParams({
      relation: 'owner',
      is_migrated: 'true',
      dedupe: 'name',
      include: 'total_count',
      page_size: '1',
    }),
    signal
  )
  const migrated = migratedPage.page.total_count ?? (migratedPage.page.has_more ? null : migratedPage.data.length)
  if (migrated === null) throw new Error('The ENS indexer could not verify the migrated name count.')
  if (!names.size) return { migrated, remaining: 0, remainingNames: [], excluded: 0 }

  const deployment = await readMigrationDeployment(client, config.ensV2MigrationHelper, config.ensV2Registry, 1)
  const result = await readMigrationNames(client, deployment, [...names], owner, signal)
  for (const { error } of result.errors) {
    if (!(error instanceof MigrationEligibilityError)) throw error
    if (error.reason === 'already-migrated' || error.reason === 'not-owner')
      throw new MigrationProgressSyncError('Migration progress is catching up with onchain changes. Please retry.')
  }
  return {
    migrated,
    remaining: result.names.length,
    remainingNames: result.names.map(({ name }) => name),
    excluded: result.errors.length,
  }
}
