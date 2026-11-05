import type { Address } from 'viem'
import type { RecordNames, ResolverDetails, ResolverRecords } from '@/types/ens'
import type { ConfigurationName } from '@/utils/settings/configurations'
import { getResolverRecordNames } from './client'

const configurationNames = (page: RecordNames): ConfigurationName[] =>
  page.names.map(({ name, linked }) => ({
    name,
    recordId: linked ? BigInt(page.record_id) : BigInt(0),
    effectiveId: BigInt(page.record_id),
  }))

interface GetConfigurationNamesParams {
  resolver: Address
  id?: bigint
  q: string
  details?: ResolverDetails
  configurations?: ResolverRecords
  signal?: AbortSignal
}

export const getConfigurationNames = async ({
  resolver,
  id,
  q,
  details,
  configurations,
  signal,
}: GetConfigurationNamesParams) => {
  if (!details || !configurations) throw new Error('The resolver API is unavailable.')

  const defaultId = BigInt(details.default_record_id ?? 0)
  // Unlinked names without a default have no API route yet. Still load every supported configuration.
  const unlinkedNamesUnavailable =
    (id === undefined || id === BigInt(0)) && defaultId === BigInt(0) && details.unlinked_name_count !== 0

  const ids =
    id === undefined
      ? configurations.records.map((record) => BigInt(record.record_id))
      : id > BigInt(0)
        ? [id]
        : defaultId > BigInt(0)
          ? [defaultId]
          : []
  const names = new Map<string, ConfigurationName>()

  // Resolver-wide and default-only views need all matching pages before filtering and paginating.
  for (const recordId of ids) {
    let skipped = 0

    while (true) {
      signal?.throwIfAborted()
      const page = await getResolverRecordNames({ resolver, id: recordId, q, offset: skipped, limit: 500, signal })

      for (const name of configurationNames(page)) {
        if (id !== BigInt(0) || name.recordId === BigInt(0)) names.set(name.name, name)
      }

      skipped += page.limit
      if (skipped >= page.total) break
      if (!page.names.length || page.limit <= 0) throw new Error('The names API returned an incomplete page.')
    }
  }

  return {
    names: [...names.values()].sort((left, right) => left.name.localeCompare(right.name)),
    total: names.size,
    unlinkedNamesUnavailable,
  }
}

interface GetConfigurationNamePageParams extends GetConfigurationNamesParams {
  offset: number
  limit: number
}

export const getConfigurationNamePage = async (params: GetConfigurationNamePageParams) => {
  const { resolver, id, q, offset, limit, signal } = params

  if (id !== undefined && id > BigInt(0)) {
    const page = await getResolverRecordNames({ resolver, id, q, offset, limit, signal })
    return { names: configurationNames(page), total: page.total, unlinkedNamesUnavailable: false }
  }

  const result = await getConfigurationNames(params)
  return { ...result, names: result.names.slice(offset, offset + limit) }
}
