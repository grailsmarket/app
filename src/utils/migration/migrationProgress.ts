import { type Address, type PublicClient, isAddress, labelhash, namehash, zeroAddress } from 'viem'
import { z } from 'zod'
import { config } from '@/lib/config'
import { NAME_WRAPPER_ABI } from '@/constants/web3/abi/NameWrapper'
import { BaseRegistrarAbi } from '@/constants/web3/abi/BaseRegistrar'
import { ENS_V2_REGISTRAR } from '@/constants/web3/abi/RegistrarV2'
import {
  assertMigrationRestrictions,
  MigrationEligibilityError,
  readMigrationDeployment,
  readMigrationName,
} from './migration'

const INDEXER = 'https://api.bigname.sh'

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
    if (page.total_count === null || (expectedTotal !== undefined && page.total_count !== expectedTotal))
      throw new Error('The ENS name count changed while checking migration progress. Please retry.')
    expectedTotal = page.total_count
    for (const row of data) {
      if (seen.has(row.name)) throw new Error('The ENS name list repeated a name. Please retry.')
      seen.add(row.name)
      if (row.name.endsWith('.reverse') || row.status === 'released' || row.status === 'unregistered') continue
      if (row.owner?.toLowerCase() !== owner.toLowerCase())
        throw new Error('The ENS owner index changed. Please retry.')
      names.add(row.name)
    }
    if (!page.has_more) {
      if (seen.size !== expectedTotal) throw new Error('The ENS name list is incomplete. Please retry.')
      break
    }
    if (!data.length || !page.next_cursor || cursors.has(page.next_cursor))
      throw new Error('The ENS name list is incomplete. Please retry.')
    cursors.add(page.next_cursor)
    params.set('cursor', page.next_cursor)
  }
  if (!names.size) return { migrated, remaining: 0, remainingNames: [], excluded: 0 }

  const deployment = await readMigrationDeployment(client, config.ensV2MigrationHelper, config.ensV2Registry, 1)
  const parentGracePeriod = await client.readContract({
    address: config.ensV2Registrar,
    abi: ENS_V2_REGISTRAR,
    functionName: 'GRACE_PERIOD',
  })
  const now = (await client.getBlock()).timestamp
  const remaining = new Set<string>()
  const lockedParents = new Set<string>()
  let excluded = 0
  const ordered = [...names].sort((a, b) => a.split('.').length - b.split('.').length || a.localeCompare(b))

  const checkName = async (name: string) => {
    signal?.throwIfAborted()
    if (!name.endsWith('.eth') || /\[[0-9a-f]{64}\]/i.test(name)) {
      excluded++
      return
    }
    const parent = name.slice(name.indexOf('.') + 1)
    if (parent === 'eth') {
      const expiry = await client.readContract({
        address: deployment.baseRegistrar,
        abi: BaseRegistrarAbi,
        functionName: 'nameExpires',
        args: [BigInt(labelhash(name.split('.')[0]))],
      })
      if (expiry <= now) {
        excluded++
        return
      }
    }
    try {
      const candidate = await readMigrationName(client, deployment, name, owner, { parentGracePeriod })
      remaining.add(name)
      if (candidate.locked) lockedParents.add(name)
    } catch (error) {
      if (!(error instanceof MigrationEligibilityError)) throw error
      if (error.reason === 'already-migrated' || error.reason === 'not-owner')
        throw new Error('Migration progress is catching up with onchain changes. Please retry.')
      if (error.reason !== 'parent-unavailable' || !lockedParents.has(parent)) {
        excluded++
        return
      }
      const node = BigInt(namehash(name))
      const [wrappedOwner, fuses, expiry] = await client.readContract({
        address: deployment.wrapper,
        abi: NAME_WRAPPER_ABI,
        functionName: 'getData',
        args: [node],
      })
      if (wrappedOwner === zeroAddress || !(fuses & 65536) || expiry <= now) {
        excluded++
        return
      }
      if (wrappedOwner.toLowerCase() !== owner.toLowerCase())
        throw new Error('Migration progress is catching up with onchain changes. Please retry.')
      const approved = await client.readContract({
        address: deployment.wrapper,
        abi: NAME_WRAPPER_ABI,
        functionName: 'getApproved',
        args: [node],
      })
      try {
        assertMigrationRestrictions(fuses, approved, true)
        remaining.add(name)
        if (fuses & 1) lockedParents.add(name)
      } catch (restriction) {
        if (!(restriction instanceof MigrationEligibilityError)) throw restriction
        excluded++
      }
    }
  }
  for (const depth of new Set(ordered.map((name) => name.split('.').length))) {
    const level = ordered.filter((name) => name.split('.').length === depth)
    for (let offset = 0; offset < level.length; offset += 5)
      await Promise.all(level.slice(offset, offset + 5).map(checkName))
  }
  signal?.throwIfAborted()
  return {
    migrated,
    remaining: remaining.size,
    remainingNames: ordered.filter((name) => remaining.has(name)),
    excluded,
  }
}
